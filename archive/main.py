# app/main.py

#TODO: Claude recommends  showing weighted average, price coefficient of variation, and price-quantity correlation. Add a legend at the top to show what is good in each of those values
#      Color code gil price if within 5% or below the historical_average
#      Remove the Listings column of the front end
#      Fix scrip cost
#      Add a column for gil per scrip
#      Do i just wan to crunch the last 200 entries per item or should I be more consistent about time frame instead of number of entries?

import requests
import time
import logging
from fastapi import FastAPI, Query
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional, Dict
from collections import defaultdict

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s %(levelname)s %(message)s',
    handlers=[
        logging.FileHandler("logs\server.log"),
        logging.StreamHandler()
    ]
)
logger = logging.getLogger(__name__)

api_timings = defaultdict(list)

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

UNIVERSALIS_URL = "https://universalis.app/api/v2"
XIVAPI_STAT_QUERY = "https://v2.xivapi.com/api/search?query=BaseParam.Name~%22{}%22&sheets=Materia&limit=500&fields=Item[].Name%2CItem[].value%2CValue"
XIVAPI_SHOP_SEARCH = "https://v2.xivapi.com/api/search?sheets=SpecialShop&query=Name=%22{}%22"
XIVAPI_SHOP_ROW = "https://v2.xivapi.com/api/sheet/SpecialShop/{}"

COLOR_STATS = {
    "Red": ["Critical Hit", "Determination", "Direct Hit Rate"],
    "Purple": ["Skill Speed", "Spell Speed"],
    "Yellow": ["Tenacity", "Piety"],
    "Blue": ["Control", "CP", "Craftsmanship"],
    "Green": ["GP", "Gathering", "Perception"],
}

class Listing(BaseModel):
    pricePerUnit: int
    quantity: int
    worldName: str

class Materia(BaseModel):
    id: int
    name: str
    stat: Optional[str]
    stat_increase: Optional[int]
    gil_price: Optional[int]
    scrip_cost: Optional[int]
    gil_per_scrip: Optional[int]
    historical_average: Optional[int]
    scrip_type: Optional[str]
    advanced_melding: Optional[bool]
    total_quantity: Optional[int]
    listing_count: Optional[int]
    cheapest_listings: Optional[List[Listing]]
    color: Optional[str]

def timed_request(name: str, url: str) -> requests.Response:
    start = time.time()
    res = requests.get(url)
    duration = time.time() - start
    api_timings[name].append(duration)
    logger.info(f"{name} took {duration:.2f}s to {url}")
    res.raise_for_status()
    return res

def fetch_prices(world: str, item_ids: List[int]) -> Dict[int, Dict]:
    prices = {}
    if not item_ids:
        return prices
    try:
        chunks = [item_ids[i:i+100] for i in range(0, len(item_ids), 100)]
        for chunk in chunks:
            ids_str = ','.join(str(i) for i in chunk)
            url = f"{UNIVERSALIS_URL}/{world}/{ids_str}?listings=50&entries=200"
            res = timed_request("Universalis", url)
            data = res.json().get("items", {})
            for item_id_str, item_data in data.items():
                item_id = int(item_id_str)
                listings = item_data.get("listings", [])
                recentHistory = item_data.get("recentHistory", [])
                if listings:
                    sorted_listings = sorted(listings, key=lambda x: x["pricePerUnit"])
                    total_revenue = sum(l["pricePerUnit"] * l["quantity"] for l in sorted_listings)
                    total_units = sum(l["quantity"] for l in sorted_listings)

                    history_revenue = sum(h["pricePerUnit"] * h["quantity"] for h in recentHistory)
                    history_units = sum(h["quantity"] for h in recentHistory)
                    #print(f"Total units {total_units} and total revenue {total_revenue} for item {item_id}")
                    prices[item_id] = {
                        #"gil_price": sorted_listings[0]["pricePerUnit"],
                        "gil_price": int(total_revenue / total_units),
                        "listing_count": len(sorted_listings),
                        "total_quantity": sum(l["quantity"] for l in sorted_listings),
                        "historical_average": int(history_revenue / history_units),
                        "cheapest_listings": [
                            {
                                "pricePerUnit": l["pricePerUnit"],
                                "quantity": l["quantity"],
                                "worldName": l["worldName"]
                            }
                            for l in sorted_listings[:10]
                        ]
                    }
                    print(f"Current average price for item {item_id} is {int(total_revenue / total_units)} compared to historical average {int(history_revenue / history_units)}")
                else:
                    prices[item_id] = {
                        "gil_price": None,
                        "listing_count": 0,
                        "total_quantity": 0,
                        "historical_average": None,
                        "cheapest_listings": []
                    }
    except Exception as e:
        logger.warning(f"Failed fetching Universalis prices: {e}")
    return prices

def fetch_scrip_costs() -> Dict[int, Dict[str, int]]:
    costs = {}
    for scrip_type, label in [("Orange Scrip Exchange (Materia)", "orange"), ("Purple Scrip Exchange (Materia)", "purple")]:
        search_url = XIVAPI_SHOP_SEARCH.format(scrip_type.replace(" ", "%20"))
        res = timed_request("XIVAPI Shop Search", search_url)
        for row in res.json().get("results", []):
            row_id = row["row_id"]
            shop = timed_request("XIVAPI Shop Row", XIVAPI_SHOP_ROW.format(row_id)).json()
            for item in shop["fields"].get("Item", []):
                item_id = item.get("value")
                item_fields = item.get("fields", {})
                cost_array = item_fields.get("CurrencyCost", [0, 0, 0])
                for cost in cost_array:
                    if cost:
                        costs[item_id] = {"cost": cost, "type": label}
    return costs

def fetch_materia(world: str):
    materia_items = []
    item_id_to_info = {}

    for color, stats in COLOR_STATS.items():
        for stat in stats:
            url = XIVAPI_STAT_QUERY.format(stat.replace(" ", "%20"))
            res = timed_request("XIVAPI Stat Query", url)
            rows = res.json().get("results", [])
            if not rows:
                continue
            row = rows[0]
            fields = row.get("fields", {})
            items = fields.get("Item", [])
            values = fields.get("Value", [])

            for idx, item in enumerate(items):
                
                item_id = item.get("value")
                name = (item.get("fields",{})).get("Name")
                print(f"Processing item: {name} (ID: {item_id})")
                if item_id and name and idx < len(values):
                    item_id_to_info[item_id] = {
                        "name": name,
                        "stat": stat,
                        "stat_increase": values[idx],
                        "color": color,
                        "meld": True
                    }

    item_ids = list(item_id_to_info.keys())
    prices = fetch_prices(world, item_ids)
    scrip_costs = fetch_scrip_costs()

    for item_id in item_ids:
        meta = item_id_to_info[item_id]
        price_data = prices.get(item_id, {})
        scrip_entry = scrip_costs.get(item_id, {})
        materia_items.append(Materia(
            id=item_id,
            name=meta["name"],
            stat=meta["stat"],
            stat_increase=meta["stat_increase"],
            gil_price=price_data.get("gil_price"),
            historical_average=price_data.get("historical_average"),
            scrip_cost=scrip_entry.get("cost"),
            gil_per_scrip = int(price_data.get("gil_price") / scrip_entry.get("cost")) if scrip_entry.get("cost") else None,
            scrip_type=scrip_entry.get("type"),
            advanced_melding=meta["meld"],
            total_quantity=price_data.get("total_quantity"),
            listing_count=price_data.get("listing_count"),
            cheapest_listings=price_data.get("cheapest_listings"),
            color=meta["color"]
        ))

    return sorted(materia_items, key=lambda x: (x.stat, -(x.stat_increase or 0), x.gil_price or float('inf')))

@app.get("/materia", response_model=List[Materia])
def get_materia(world: str = Query(..., description="Server name, e.g. 'Aether'")):
    return fetch_materia(world)

@app.get("/debug/timing")
def get_api_timings():
    return {k: {"calls": len(v), "avg_time": sum(v) / len(v) if v else 0, "total_time": sum(v)} for k, v in api_timings.items()}

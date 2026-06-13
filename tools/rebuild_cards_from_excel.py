import json
import re
from collections import Counter
from pathlib import Path

import openpyxl


ROOT = Path(__file__).resolve().parents[1]
DOWNLOADS = Path.home() / "Downloads"
EXCEL_NAME = "九州_七大奇迹标准版重建牌库.xlsx"
EXCEL_PATH = DOWNLOADS / EXCEL_NAME
DATA_DIR = ROOT / "data"

BASIC_RESOURCES = ["粮食", "木材", "石料", "铁矿"]
ADVANCED_RESOURCES = ["陶器", "简帛", "布匹"]
RESOURCE_NAMES = BASIC_RESOURCES + ADVANCED_RESOURCES
SCIENCE_NAMES = ["经学", "工学", "史学"]

TYPE_TO_COLOR = {
    "资源": "brown",
    "高级资源": "gray",
    "文明": "blue",
    "商业": "yellow",
    "军事": "red",
    "学术": "green",
    "公会": "purple",
}

TYPE_TO_KIND = {
    "资源": "resource",
    "高级资源": "resource",
    "文明": "civilian",
    "商业": "commercial",
    "军事": "military",
    "学术": "science",
    "公会": "guild",
}

COLOR_BY_TEXT = {
    "棕色": "brown",
    "灰色": "gray",
    "蓝色": "blue",
    "红色": "red",
    "绿色": "green",
    "黄色": "yellow",
    "紫色": "purple",
}

CHAIN_RELATIONS = {
    "baths": {
        "to": ["aqueduct"],
        "icons": ["chain_baths_aqueduct.svg"],
    },
    "aqueduct": {
        "from": "baths",
        "icons": ["chain_baths_aqueduct.svg"],
    },
    "altar": {
        "to": ["temple"],
        "icons": ["chain_altar_temple.svg"],
    },
    "temple": {
        "from": "altar",
        "to": ["pantheon"],
        "icons": ["chain_altar_temple.svg", "chain_temple_pantheon.svg"],
    },
    "pantheon": {
        "from": "temple",
        "icons": ["chain_temple_pantheon.svg"],
    },
    "theater": {
        "to": ["statue"],
        "icons": ["chain_theater_statue.svg"],
    },
    "statue": {
        "from": "theater",
        "to": ["gardens"],
        "icons": ["chain_theater_statue.svg", "chain_statue_gardens.svg"],
    },
    "gardens": {
        "from": "statue",
        "icons": ["chain_statue_gardens.svg"],
    },
    "scriptorium": {
        "to": ["library"],
        "icons": ["chain_scriptorium_library.svg"],
    },
    "library": {
        "from": "scriptorium",
        "to": ["senate"],
        "icons": ["chain_scriptorium_library.svg", "chain_library_senate.svg"],
    },
    "senate": {
        "from": "library",
        "icons": ["chain_library_senate.svg"],
    },
    "apothecary": {
        "to": ["dispensary"],
        "icons": ["chain_apothecary_dispensary.svg"],
    },
    "dispensary": {
        "from": "apothecary",
        "to": ["lodge"],
        "icons": ["chain_apothecary_dispensary.svg", "chain_dispensary_lodge.svg"],
    },
    "lodge": {
        "from": "dispensary",
        "icons": ["chain_dispensary_lodge.svg"],
    },
    "workshop": {
        "to": ["laboratory"],
        "icons": ["chain_workshop_laboratory.svg"],
    },
    "laboratory": {
        "from": "workshop",
        "to": ["observatory"],
        "icons": ["chain_workshop_laboratory.svg", "chain_laboratory_observatory.svg"],
    },
    "observatory": {
        "from": "laboratory",
        "icons": ["chain_laboratory_observatory.svg"],
    },
    "school": {
        "to": ["academy", "study"],
        "icons": ["chain_school_academy.svg", "chain_school_study.svg"],
    },
    "academy": {
        "from": "school",
        "icons": ["chain_school_academy.svg"],
    },
    "study": {
        "from": "school",
        "icons": ["chain_school_study.svg"],
    },
    "walls": {
        "to": ["fortifications"],
        "icons": ["chain_walls_fortifications.svg"],
    },
    "fortifications": {
        "from": "walls",
        "icons": ["chain_walls_fortifications.svg"],
    },
    "training_ground": {
        "to": ["circus"],
        "icons": ["chain_training_ground_circus.svg"],
    },
    "circus": {
        "from": "training_ground",
        "icons": ["chain_training_ground_circus.svg"],
    },
}

CHAIN_TO_ICON = {
    ("baths", "aqueduct"): "chain_baths_aqueduct.svg",
    ("altar", "temple"): "chain_altar_temple.svg",
    ("temple", "pantheon"): "chain_temple_pantheon.svg",
    ("theater", "statue"): "chain_theater_statue.svg",
    ("statue", "gardens"): "chain_statue_gardens.svg",
    ("scriptorium", "library"): "chain_scriptorium_library.svg",
    ("library", "senate"): "chain_library_senate.svg",
    ("apothecary", "dispensary"): "chain_apothecary_dispensary.svg",
    ("dispensary", "lodge"): "chain_dispensary_lodge.svg",
    ("workshop", "laboratory"): "chain_workshop_laboratory.svg",
    ("laboratory", "observatory"): "chain_laboratory_observatory.svg",
    ("school", "academy"): "chain_school_academy.svg",
    ("school", "study"): "chain_school_study.svg",
    ("walls", "fortifications"): "chain_walls_fortifications.svg",
    ("training_ground", "circus"): "chain_training_ground_circus.svg",
}


def slugify(value):
    value = value.lower().replace("&", "and")
    value = re.sub(r"[^a-z0-9]+", "_", value)
    return re.sub(r"_+", "_", value).strip("_")


def amount_items(text):
    if not text or text == "免费":
        return []
    main = str(text).split("；")[0]
    items = []
    for name, amount in re.findall(r"([木材石料粮食铁矿陶器简帛布匹铜钱]+)×(\d+)", main):
        resource = "coins" if name == "铜钱" else name
        items.extend([resource] * int(amount))
    return items


def count_map(items):
    counts = Counter(items)
    return {name: counts[name] for name in sorted(counts)}


def parse_min_players(value):
    text = str(value or "").strip()
    if text == "随机":
        return 3, True
    match = re.search(r"\d+", text)
    return int(match.group(0)) if match else 3, False


def parse_age(value):
    match = re.search(r"\d+", str(value or ""))
    return int(match.group(0)) if match else 1


def parse_produces(symbol, effect, card_type):
    text = str(symbol or "")
    effect_text = str(effect or "")
    if card_type not in ("资源", "高级资源"):
        return [], None
    resources = []
    for name, amount in re.findall(r"([木材石料粮食铁矿陶器简帛布匹]+)×(\d+)", text):
        resources.extend([name] * int(amount))
    if "/" in text:
        return resources, sorted(set(resources), key=resources.index)
    return resources, None


def parse_points(effect):
    match = re.search(r"文明分：(\d+)", str(effect or ""))
    return int(match.group(1)) if match else 0


def parse_shields(effect):
    match = re.search(r"武备：\+?(\d+)", str(effect or ""))
    return int(match.group(1)) if match else 0


def parse_science(symbol, effect):
    text = f"{symbol or ''} {effect or ''}"
    for name in SCIENCE_NAMES:
        if name in text:
            return name
    return None


def parse_coins(effect):
    text = str(effect or "")
    if "立刻获得" in text or "立刻得" in text:
        match = re.search(r"铜钱×(\d+)", text)
        if match and "每有" not in text and "每完成" not in text:
            return int(match.group(1))
    return 0


def parse_trade_discount(effect):
    text = str(effect or "")
    if "购买右邻基础资源" in text:
        return {"right": BASIC_RESOURCES}
    if "购买左邻基础资源" in text:
        return {"left": BASIC_RESOURCES}
    if "购买左右邻高级资源" in text:
        return {"left": ADVANCED_RESOURCES, "right": ADVANCED_RESOURCES}
    return None


def parse_commercial_effect(effect):
    text = str(effect or "")
    if "棕色资源牌" in text and "自己每有" in text:
        return {"perColorCoins": {"brown": 1}, "commerceScore": {"type": "color", "color": "brown", "points": 1}}
    if "黄色商业牌" in text and "自己每有" in text:
        return {"perColorCoins": {"yellow": 1}, "commerceScore": {"type": "yellow", "points": 1}}
    if "灰色高级资源牌" in text and "自己每有" in text:
        return {"perColorCoins": {"gray": 2}, "commerceScore": {"type": "color", "color": "gray", "points": 2}}
    if "奇迹阶段" in text and "自己每完成" in text:
        return {"perWonderStageCoins": 3, "commerceScore": {"type": "stages", "points": 1}}
    if "自己和左右邻每有1张棕色资源牌" in text:
        return {"perNeighborColorCoins": {"brown": 1}}
    if "自己和左右邻每有1张灰色高级资源牌" in text:
        return {"perNeighborColorCoins": {"gray": 2}}
    return {}


def parse_guild_score(prototype, effect):
    key = slugify(prototype)
    mapping = {
        "workers_guild": "neighborBrown",
        "craftsmens_guild": "neighborGrayDouble",
        "traders_guild": "neighborYellow",
        "philosophers_guild": "neighborGreen",
        "spies_guild": "neighborRed",
        "strategists_guild": "neighborDefeats",
        "shipowners_guild": "selfBrownGrayPurple",
        "scientists_guild": "chooseScienceAtEnd",
        "magistrates_guild": "neighborBlue",
        "builders_guild": "stagesAll",
    }
    return mapping.get(key)


def chain_fields(chain_key):
    relation = CHAIN_RELATIONS.get(chain_key, {})
    chain_from = relation.get("from")
    chain_to = relation.get("to", [])
    icons = relation.get("icons", [])
    from_icons = []
    to_icons = []
    if chain_from:
        icon = CHAIN_TO_ICON.get((chain_from, chain_key))
        if icon:
            from_icons.append(icon)
    for target in chain_to:
        icon = CHAIN_TO_ICON.get((chain_key, target))
        if icon:
            to_icons.append(icon)
    return {
        "chain_from": chain_from,
        "chain_to": chain_to,
        "chain_icon": icons[0] if len(icons) == 1 else icons,
        "chain_from_icons": from_icons,
        "chain_to_icons": to_icons,
    }


def convert_row(row):
    age = parse_age(row["时代"])
    min_players, guild_random = parse_min_players(row["入局人数"])
    prototype = str(row["七大奇迹原型"]).strip()
    chain_key = slugify(prototype)
    name = str(row["九州牌名"]).strip()
    source_id = str(row["编号"]).strip()
    player_suffix = "guild" if guild_random else f"{min_players}p"
    card_id = f"age{age}_{chain_key}_{player_suffix}"
    card_type = str(row["类型"]).strip()
    effect_text = str(row["产出/效果"] or "").strip()
    cost = amount_items(row["成本"])
    produces, resource_choice = parse_produces(row["符号"], effect_text, card_type)
    commercial = parse_commercial_effect(effect_text)
    card = {
        "id": card_id,
        "sourceId": source_id,
        "card_id": card_id,
        "age": age,
        "minPlayers": min_players,
        "playerCount": row["入局人数"],
        "name": name,
        "displayName": name,
        "display_name": name,
        "originalName": prototype,
        "original_name": prototype,
        "chainKey": chain_key,
        "color": TYPE_TO_COLOR[card_type],
        "type": TYPE_TO_KIND[card_type],
        "cost": cost,
        "costMap": count_map(cost),
        "produces": produces,
        "resourceChoice": resource_choice,
        "output": {},
        "points": parse_points(effect_text),
        "shields": parse_shields(effect_text),
        "scienceSymbol": parse_science(row["符号"], effect_text),
        "coins": parse_coins(effect_text),
        "effect": None,
        "effectText": effect_text,
        "effect_text": effect_text,
        "description": effect_text,
        "tradeDiscount": parse_trade_discount(effect_text),
        "resource": count_map(produces),
        "machineReadableEffect": {},
        "machine_readable_effect": {},
        "guild": guild_random,
        "guildRandom": guild_random,
        "remarks": row.get("备注") or "",
    }
    if card["points"]:
        card["output"]["vp"] = card["points"]
    if card["shields"]:
        card["output"]["shields"] = card["shields"]
    if card["scienceSymbol"]:
        card["output"]["science"] = card["scienceSymbol"]
    if card["coins"]:
        card["output"]["coins"] = card["coins"]
    if produces:
        if resource_choice:
            card["output"]["resource_choice"] = resource_choice
        else:
            card["output"]["resource_production"] = count_map(produces)
    for key, value in commercial.items():
        card[key] = value
    if card["type"] == "guild":
        card["guildScore"] = parse_guild_score(prototype, effect_text)
    card.update(chain_fields(chain_key))
    card["machineReadableEffect"] = {
        key: card[key]
        for key in [
            "tradeDiscount",
            "perColorCoins",
            "perNeighborColorCoins",
            "perWonderStageCoins",
            "commerceScore",
            "guildScore",
            "resourceChoice",
        ]
        if card.get(key)
    }
    card["machine_readable_effect"] = card["machineReadableEffect"]
    return card


def main():
    workbook = openpyxl.load_workbook(EXCEL_PATH, data_only=True)
    sheet = workbook["重建总牌库"]
    headers = [cell.value for cell in sheet[1]]
    cards = []
    for raw in sheet.iter_rows(min_row=2, values_only=True):
        if not any(raw):
            continue
        cards.append(convert_row(dict(zip(headers, raw))))

    data = {
        "resources": RESOURCE_NAMES,
        "scienceSymbols": SCIENCE_NAMES,
        "cardColors": ["brown", "gray", "blue", "red", "yellow", "green", "purple"],
        "guildSelection": {"age": 3, "countOffset": 2},
        "chainIconBasePath": "assets/icons/chains/",
        "ages": {
            "1": [card for card in cards if card["age"] == 1],
            "2": [card for card in cards if card["age"] == 2],
            "3": [card for card in cards if card["age"] == 3],
        },
    }

    DATA_DIR.mkdir(exist_ok=True)
    json_text = json.dumps(data, ensure_ascii=False, indent=2)
    (DATA_DIR / "cards.json").write_text(json_text + "\n", encoding="utf-8")
    (DATA_DIR / "cards-data.js").write_text(
        "window.JIUZHOU_CARDS = " + json_text + ";\n",
        encoding="utf-8",
    )
    counts = {age: len(data["ages"][age]) for age in ["1", "2", "3"]}
    print(json.dumps({"total": len(cards), "ages": counts}, ensure_ascii=False))


if __name__ == "__main__":
    main()

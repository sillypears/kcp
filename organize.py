import psycopg2
from psycopg2.extras import RealDictCursor
import json
import sys
from typing import Dict, List
from argparse import ArgumentParser, Namespace
from datetime import datetime
import os
from dotenv import load_dotenv

load_dotenv(".env.production")


def get_db():
    return psycopg2.connect(
        host=os.getenv("PG_HOST", "localhost"),
        port=int(os.getenv("PG_PORT", "5432")),
        user=os.getenv("PG_USER", "postgres"),
        password=os.getenv("PG_PASS", ""),
        database=os.getenv("PG_DB", "keyc"),
    )


def load_boxes_config(config_path: str) -> list:
    try:
        with open(config_path, "r", encoding="utf-8") as f:
            data = json.load(f)
        return data.get("boxes", [])
    except Exception as e:
        print(f"Error loading {config_path}: {e}")
        sys.exit(1)


def load_boxes_from_db(conn) -> list:
    cur = conn.cursor(cursor_factory=RealDictCursor)
    cur.execute("SELECT * FROM boxes ORDER BY label")
    return cur.fetchall()


def build_dedicated_mapping(boxes: list) -> Dict[str, str]:
    dedicated = {}
    for box in boxes:
        if box.get("dedicated") and box.get("maker_name"):
            maker = box["maker_name"].strip()
            if maker:
                dedicated[maker] = box["label"]
    return dedicated


def get_consolidation_box(boxes: list) -> str:
    candidates = [
        box
        for box in boxes
        if not box.get("dedicated", False) and box.get("allow_add", True)
    ]
    if not candidates:
        print("Error: No suitable consolidation box found.")
        sys.exit(1)

    best = max(candidates, key=lambda x: x.get("capacity", 0))
    return best["label"]


def get_no_add_boxes(boxes: list) -> set:
    return {box["label"] for box in boxes if not box.get("allow_add", True)}


def read_keycaps(conn) -> List[dict]:
    cur = conn.cursor(cursor_factory=RealDictCursor)
    cur.execute("""
        SELECT 
            k.id,
            k.maker_id,
            m.maker_name,
            k.sculpt,
            k.colorway,
            k.box_id,
            b.label as box_label
        FROM keycaps k
        LEFT JOIN makers m ON m.id = k.maker_id
        LEFT JOIN boxes b ON b.id = k.box_id
        ORDER BY m.maker_name, k.sculpt
    """)
    return cur.fetchall()


def get_maker_distribution(keycaps: List[dict]) -> Dict:
    maker_groups = {}
    for cap in keycaps:
        maker = cap.get("maker_name") or "Unknown Maker"
        box_label = cap.get("box_label") or ""

        if maker not in maker_groups:
            maker_groups[maker] = {"total": 0, "distribution": {}, "caps_by_box": {}}

        maker_groups[maker]["total"] += 1
        if box_label not in maker_groups[maker]["distribution"]:
            maker_groups[maker]["distribution"][box_label] = 0
            maker_groups[maker]["caps_by_box"][box_label] = []

        maker_groups[maker]["distribution"][box_label] += 1
        maker_groups[maker]["caps_by_box"][box_label].append(cap.get("sculpt", ""))

    for maker in maker_groups:
        boxes = sorted([b for b in maker_groups[maker]["distribution"].keys() if b])
        maker_groups[maker]["boxes"] = boxes

    return maker_groups


def suggest_target_box(
    maker: str, info: dict, dedicated: Dict, consolidation: str, boxes: list
) -> str:
    if maker in dedicated:
        return dedicated[maker]

    # Filter to boxes that allow adding
    allow_add_boxes = {b["label"] for b in boxes if b.get("allow_add", True)}

    non_blank = {
        b: c for b, c in info["distribution"].items() if b and b in allow_add_boxes
    }
    if non_blank:
        return max(non_blank, key=non_blank.get)

    return consolidation


def generate_moves(
    keycaps: List[dict],
    maker_groups: dict,
    dedicated: Dict,
    consolidation: str,
    no_add: set,
    boxes: list,
) -> List[Dict]:
    moves = []

    for maker, info in maker_groups.items():
        target = suggest_target_box(maker, info, dedicated, consolidation, boxes)

        for current_box, count in info["distribution"].items():
            if current_box and current_box != target and current_box not in no_add:
                caps_to_move = info["caps_by_box"].get(current_box, [])
                moves.append(
                    {
                        "maker": maker,
                        "from_box": current_box,
                        "to_box": target,
                        "count": count,
                        "caps": caps_to_move,
                    }
                )

    moves.sort(key=lambda x: x["maker"])
    return moves


def get_current_counts(keycaps: List[dict]) -> Dict[str, int]:
    counts = {}
    for cap in keycaps:
        box_label = cap.get("box_label")
        if box_label:
            counts[box_label] = counts.get(box_label, 0) + 1
    return counts


def display_boxes_visual(boxes: list, current_counts: Dict[str, int]):
    print("\n" + "=" * 80)
    print("                  BOX INVENTORY - VISUAL LAYOUT")
    print("=" * 80)

    for box in boxes:
        label = box.get("label", "??")
        name = box.get("name", "Unnamed")
        capacity = box.get("capacity", 0)
        height = box.get("height", 1)
        width = box.get("width", 1)
        dedicated = box.get("dedicated", False)
        allow_add = box.get("allow_add", True)

        current = current_counts.get(label, 0)
        fill_percent = (current / capacity * 100) if capacity > 0 else 0

        status = "DEDICATED" if dedicated else "REGULAR"
        add_status = "✓ Can add" if allow_add else "✗ No adds"

        print(
            f"\n{label:3} | {name:<25} | {current:3}/{capacity:3} ({fill_percent:5.1f}%) | {status} | {add_status}"
        )

        total_cells = height * width
        filled = min(current, capacity)

        print("   ┌" + "───┬" * (width - 1) + "───┐")

        cell_idx = 0
        for row in range(height):
            line = "   │"
            for col in range(width):
                if cell_idx < filled:
                    line += " █ │"
                elif cell_idx < capacity:
                    line += " · │"
                else:
                    line += "   │"
                cell_idx += 1
            print(line)
            if row < height - 1:
                print("   ├" + "───┼" * (width - 1) + "───┤")
        print("   └" + "───┴" * (width - 1) + "───┘")

        if capacity < total_cells:
            print(
                f"   Note: Only {capacity} spots used → some cells merged in real life"
            )

    print("\n" + "=" * 80)


def print_summary(
    keycaps: List[dict],
    maker_groups: dict,
    moves: List[Dict],
    dedicated: Dict,
    consolidation: str,
    no_add: set,
    boxes: list,
):
    print(f"Total sculpts      : {len(keycaps)}")
    print(f"Total makers       : {len(maker_groups)}")
    print(f"Dedicated makers   : {len(dedicated)}")
    print(f"Consolidation box  : {consolidation}")
    print(f"Forbidden boxes    : {sorted(no_add)}")

    scattered = sorted(
        [
            (m, info)
            for m, info in maker_groups.items()
            if len(info.get("boxes", [])) > 1
        ],
        key=lambda x: x[1]["total"],
        reverse=True,
    )[:12]

    print("\n--- Top Scattered Makers ---")
    for maker, info in scattered:
        target = suggest_target_box(maker, info, dedicated, consolidation, boxes)
        print(
            f"{maker:22} | {info['total']:2} caps | boxes: {info['boxes']} → **{target}**"
        )

    print("\n--- Recommended Moves ---")
    current_maker = None
    for move in moves:
        if move["maker"] != current_maker:
            current_maker = move["maker"]
            print(f"\n{current_maker}")
        for cap in move["caps"]:
            print(f"  {move['from_box']:>3} → {move['to_box']:>3} | {cap}")


def parse_args() -> Namespace:
    parser = ArgumentParser(description="Keycap Organization Tool")

    parser.add_argument(
        "-d", "--debug", dest="DEBUG", default=False, action="store_true"
    )

    parser.add_argument("-b", "--boxes", dest="boxes", default="boxes.json")

    parser.add_argument("-o", "--output", dest="output_file", default=None)

    parser.add_argument(
        "-v", "--visualize", dest="visualize", default=False, action="store_true"
    )

    return parser.parse_args()


def main(args):
    if args.output_file is None:
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        args.output_file = f"cap_moves_{timestamp}.csv"

    conn = get_db()

    try:
        if os.path.exists(args.boxes):
            boxes = load_boxes_config(args.boxes)
        else:
            print(f"Boxes config {args.boxes} not found, loading from database...")
            boxes = load_boxes_from_db(conn)

        dedicated = build_dedicated_mapping(boxes)
        consolidation = get_consolidation_box(boxes)
        no_add_boxes = get_no_add_boxes(boxes)

        keycaps = read_keycaps(conn)

        maker_groups = get_maker_distribution(keycaps)
        moves = generate_moves(
            keycaps, maker_groups, dedicated, consolidation, no_add_boxes, boxes
        )

        if args.visualize:
            display_boxes_visual(boxes, get_current_counts(keycaps))
            return

        print_summary(
            keycaps, maker_groups, moves, dedicated, consolidation, no_add_boxes, boxes
        )

        if moves:
            import pandas as pd

            moves_df = pd.DataFrame(moves)
            moves_df.to_csv(args.output_file, index=False)
            print(f"\nFull rec moves exported to '{args.output_file}'")
            print(f"   ({len(moves)} total suggested moves)")
        else:
            print("\nNo moves needed!")

    finally:
        conn.close()


if __name__ == "__main__":
    args = parse_args()
    main(args)

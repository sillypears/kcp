import pandas as pd
import json
import sys
from typing import Dict, List
from argparse import ArgumentParser, Namespace
from datetime import datetime

def load_boxes_config(config_path: str) -> list:
    """Load boxes configuration from JSON"""
    try:
        with open(config_path, 'r', encoding='utf-8') as f:
            data = json.load(f)
        return data.get("boxes", [])
    except Exception as e:
        print(f"Error loading {config_path}: {e}")
        sys.exit(1)


def build_dedicated_mapping(boxes: list) -> Dict[str, str]:
    """Create maker_name -> label mapping for dedicated boxes"""
    dedicated = {}
    for box in boxes:
        if box.get("dedicated") and box.get("maker_name"):
            maker = box["maker_name"].strip()
            if maker:
                dedicated[maker] = box["label"]
    return dedicated


def get_consolidation_box(boxes: list) -> str:
    """Find the best consolidation box (largest non-dedicated + allow_add=True)"""
    candidates = [
        box for box in boxes
        if not box.get("dedicated", False) and box.get("allow_add", True)
    ]
    if not candidates:
        print("Error: No suitable consolidation box found.")
        sys.exit(1)
    
    best = max(candidates, key=lambda x: x.get("capacity", 0))
    return best["label"]


def get_no_add_boxes(boxes: list) -> set:
    """Return set of box labels that should never receive new caps"""
    return {box["label"] for box in boxes if not box.get("allow_add", True)}


def read_keycaps(csv_path: str) -> pd.DataFrame:
    df = pd.read_csv(csv_path)
    df['Maker'] = df['Maker'].fillna('Unknown Maker').astype(str).str.strip()
    df['Box'] = df['Box'].fillna('').astype(str).str.strip()
    df['Unique_Name'] = df['Unique_Name'].fillna('Unknown')
    return df


def get_maker_distribution(df: pd.DataFrame) -> Dict:
    maker_groups = {}
    for maker, group in df.groupby('Maker', sort=False):
        box_counts = group['Box'].value_counts().to_dict()
        boxes = sorted([b for b in box_counts if b])
        
        maker_groups[maker] = {
            'total': len(group),
            'distribution': box_counts,
            'boxes': boxes,
            'caps_by_box': {
                box: group[group['Box'] == box]['Unique_Name'].tolist()
                for box in box_counts if box
            }
        }
    return maker_groups


def suggest_target_box(maker: str, info: dict, dedicated: Dict, consolidation: str) -> str:
    """Decide best target box for a maker"""
    if maker in dedicated:
        return dedicated[maker]
    
    non_blank = {b: c for b, c in info['distribution'].items() if b}
    if non_blank:
        return max(non_blank, key=non_blank.get)
    
    return consolidation


def generate_moves(df: pd.DataFrame, maker_groups: dict, dedicated: Dict,
                  consolidation: str, no_add: set) -> List[Dict]:
    moves = []
    
    for maker, info in maker_groups.items():
        target = suggest_target_box(maker, info, dedicated, consolidation)
        
        for current_box, count in info['distribution'].items():
            if current_box and current_box != target and current_box not in no_add:
                caps_to_move = info['caps_by_box'].get(current_box, [])
                moves.append({
                    'maker': maker,
                    'from_box': current_box,
                    'to_box': target,
                    'count': count,
                    'caps': caps_to_move[:6]
                })
    
    moves.sort(key=lambda x: x['count'], reverse=True)
    return moves


def print_summary(df: pd.DataFrame, maker_groups: dict, moves: List[Dict],
                  dedicated: Dict, consolidation: str, no_add: set):
    
    print(f"Total sculpts      : {len(df)}")
    print(f"Total makers       : {len(maker_groups)}")
    print(f"Dedicated makers   : {len(dedicated)}")
    print(f"Consolidation box  : {consolidation}")
    print(f"Forbidden boxes    : {sorted(no_add)}")
    
    scattered = sorted(
        [(m, info) for m, info in maker_groups.items() if len(info.get('boxes', [])) > 1],
        key=lambda x: x[1]['total'], reverse=True
    )[:12]
    
    print("\n--- Top Scattered Makers ---")
    for maker, info in scattered:
        target = suggest_target_box(maker, info, dedicated, consolidation)
        print(f"{maker:22} | {info['total']:2} caps | boxes: {info['boxes']} → **{target}**")
    
    print("\n--- Recommended Moves (Biggest First) ---")
    for i, move in enumerate(moves[:20], 1):
        preview = ", ".join(move['caps'][:3])
        if len(move['caps']) > 3:
            preview += f" +{len(move['caps'])-3} more"
        print(f"{i:2}. {move['maker']:20} | {move['count']:2} caps  {move['from_box']:>3} → {move['to_box']}")
        if preview:
            print(f"     └─ {preview}")


def parse_args() -> Namespace:
    parser = ArgumentParser(description="Clack & Order - Artisan Keycap Organizer")
    
    parser.add_argument('-d', '--debug', 
                        dest="DEBUG", 
                        default=False, 
                        action="store_true",
                        help="Enable debug output")
    
    parser.add_argument('-b', '--boxes', 
                        dest="boxes", 
                        default="boxes.json", 
                        help="Path to boxes.json config file (default: boxes.json)")
    
    parser.add_argument('-f', '--file', 
                        dest="input_file", 
                        required=True, 
                        help="Path to the keycaps CSV file (required)")
    
    parser.add_argument('-o', '--output', 
                        dest="output_file", 
                        default=None, 
                        help="Output filename for moves CSV (default: auto-generated with timestamp)")
    
    return parser.parse_args()


def main():
    args = parse_args()
    
    if args.output_file is None:
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        args.output_file = f"cap_moves_{timestamp}.csv"
        
    boxes = load_boxes_config(args.boxes)
    dedicated = build_dedicated_mapping(boxes)
    consolidation = get_consolidation_box(boxes)
    no_add_boxes = get_no_add_boxes(boxes)
    
    df = read_keycaps(args.input_file)
    maker_groups = get_maker_distribution(df)
    moves = generate_moves(df, maker_groups, dedicated, consolidation, no_add_boxes)
    
    print_summary(df, maker_groups, moves, dedicated, consolidation, no_add_boxes)
    
    # Export full move list
    moves_df = pd.DataFrame(moves)
    moves_df.to_csv(args.output_file, index=False)
    
    print(f"\nFull rec moves exported to '{args.output_file}'")
    print(f"   ({len(moves)} total suggested moves)")


if __name__ == "__main__":
    main()
import csv

boxes = {
    "B1": 1,
    "B2": 2,
    "B3": 3,
    "B4": 4,
    "B5": 5,
    "B6": 6,
    "B8": 7,
    "B9": 8,
    "H1": 9,
    "P1": 10,
    "N1": 11,
    "T1": 12,
}

makers = {
    "8o8Keys": 1,
    "ACONIC": 2,
    "ALMONDcaps": 3,
    "Absyrd Artysyns": 4,
    "Aero Keys": 5,
    "Alpha Keycaps": 6,
    "Amidst The Clouds": 7,
    "Anomaly Caps": 8,
    "Apothecary Caps": 9,
    "Arq Keebs": 10,
    "Artkey Universe": 11,
    "Arunika Keycaps": 12,
    "Ato Works": 13,
    "Azi Keycaps": 14,
    "BGCaps": 15,
    "BKM Caps": 16,
    "BOOST": 17,
    "BRIZ": 18,
    "Bad Habit Caps": 19,
    "Bhomass Caps": 20,
    "Black Mage Caps": 21,
    "Bludgeoned Kaps": 22,
    "Bogan Caps": 23,
    "Bogwitch Brie": 24,
    "BrewCaps": 25,
    "Bro Caps": 26,
    "C.Y.O. Caps": 27,
    "CYSM": 28,
    "Cap-A-Cop": 29,
    "China Keycap Clones": 30,
    "Clack Factory": 31,
    "CozCaps": 32,
    "CraftKey": 33,
    "DCcaps": 34,
    "Dad Caps": 35,
    "Dalifu. Caps": 36,
    "Death Caps": 37,
    "Death Wish Caps": 38,
    "Destroyer Caps": 39,
    "Digitvoid": 40,
    "Doll Caps": 41,
    "Dollartacos": 42,
    "Doohickeys": 43,
    "Dreadkeys": 44,
    "Duck's Nest Keycaps": 45,
    "Eldritch": 46,
    "Ennui Apathy": 47,
    "Fraktal Kaps": 48,
    "Frumpzkeys": 49,
    "GTB": 50,
    "Gloom": 51,
    "Glyco Caps": 52,
    "GoldenStar Keycap": 53,
    "Goth Caps": 54,
    "Grimey as Fuck": 55,
    "Hellbent Caps": 56,
    "Hello? Caps": 57,
    "Hot Keys Project": 58,
    "Hungerwork Studio": 59,
    "Hungry Hustlas": 60,
    "Idea23": 61,
    "Inkblot Caps": 62,
    "Inkless": 63,
    "Jelly key": 64,
    "Jusherhoe": 65,
    "Just Another Keymaker": 66,
    "KB Keycraft": 67,
    "KUG": 68,
    "Kap Haus": 69,
    "KeyCravings": 70,
    "KeyForge": 71,
    "KeyKollectiv": 72,
    "Killer Napkins": 73,
    "Kittykapz": 74,
    "Ko Caps": 75,
    "Krap Shop": 76,
    "Kult Worship Kaps": 77,
    "Kye": 78,
    "Latrialum": 79,
    "Lazer Caps": 80,
    "Lazy Caps": 81,
    "Level Caps": 82,
    "Lividity Caps": 83,
    "Lo-Ki Caps": 84,
    "MD3": 85,
    "MFC": 86,
    "Maison of the West": 87,
    "MarioTheGuy": 88,
    "Mastonon Kaps": 89,
    "Metaslug Keycap": 90,
    "MitchCapped": 91,
    "Mohawk Caps": 92,
    "Moistgun": 93,
    "Monstera Keycaps": 94,
    "Myth Caps": 95,
    "NOTCAPS": 96,
    "Navacaps": 97,
    "NibbNubb Keycaps": 98,
    "Nightcaps": 99,
    "Nubbinator": 100,
    "Obscura": 101,
    "Omniclectic": 102,
    "Ono.Keys": 103,
    "Orin Caps": 104,
    "P.Craft Studio": 105,
    "PRIME": 106,
    "Panduuh Caps": 107,
    "Pernicious Pony": 108,
    "Phage Caps": 109,
    "Pip Johnson": 110,
    "PixArt Valley": 111,
    "Polymer Salon": 112,
    "PrimeCaps": 113,
    "Quest Keyboards": 114,
    "RADcaps": 115,
    "RTG Caps": 116,
    "RUNERYDER": 117,
    "Ratchet Caps": 118,
    "Rath Caps": 119,
    "Raw Studio": 120,
    "Resin Party": 121,
    "Ritual Master": 122,
    "Room A": 123,
    "Rubrehose": 124,
    "Rykou": 125,
    "SMEAR Caps": 126,
    "Save Caps": 127,
    "Sinpra Caps": 128,
    "Sir Real Caps": 129,
    "Slime Scholar": 130,
    "SludgeKidd": 131,
    "Smokeyspinswater": 132,
    "SodieCaps": 133,
    "Sonder Caps": 134,
    "Soomcaps": 135,
    "Stone Keys World": 136,
    "Sublyme Keys": 137,
    "Suited Up Keycaps": 138,
    "TXD Caps": 139,
    "Tech. Stoned. Amish.": 140,
    "The Keycat": 141,
    "Tiny Makes Things": 142,
    "Vice Caps": 143,
    "Waxface Keycaps": 144,
    "Wheat Keys": 145,
    "Wildstory Caps": 146,
    "Win_Keys": 147,
    "Yuck Studio": 148,
    "ZorbCaps": 149,
    "agericke": 150,
    "alheckz": 151,
    "haoN": 152,
    "n3rdly": 153,
    "tr.mk": 154,
    "tyrekasaurus": 155,
    "zearoh": 156,
}


def esc(s):
    if s is None or s == "":
        return "NULL"
    return "'" + s.replace("'", "''") + "'"


missing_makers = set()
missing_boxes = set()
rows = []

with open("caps.csv") as f:
    reader = csv.DictReader(f)
    for row in reader:
        maker = row["Maker"].strip()
        sculpt = row["Sculpt"].strip()
        colorway = row["Colorway"].strip()
        box = row["Box"].strip()

        mid = makers.get(maker) if maker else None
        bid = boxes.get(box) if box else None

        if maker and mid is None:
            missing_makers.add(maker)
        if box and bid is None:
            missing_boxes.add(box)

        rows.append(
            f"({mid if mid else 'NULL'}, {bid if bid else 'NULL'}, {esc(sculpt)}, {esc(colorway)})"
        )

BATCH = 100
for i in range(0, len(rows), BATCH):
    chunk = rows[i : i + BATCH]
    print(
        f"INSERT INTO keycaps (maker_id, box_id, sculpt, colorway) VALUES\n  {',\n  '.join(chunk)};"
    )

if missing_makers:
    print(f"\n-- WARNING: Missing makers: {missing_makers}")
if missing_boxes:
    print(f"\n-- WARNING: Missing boxes: {missing_boxes}")

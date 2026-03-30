# Artisan Whisperer

Takes your disorganized boxes and makes them organized, but you have to move them.

## Requirements

1. Python (duh)
2. CSV of caps and where they are located
   1. Required format should be
     `'Maker','Sculpt','Colorway','Box'`
   2. Google sheets was used to create it which added a "UniqueName" field which is a concat of maker+sculpt to do deduping
     `=SUBSTITUTE(CONCAT(A2,B2)," ", "_")`
3. A JSON file called boxes.json with the boxes size and capacity

   1. Dedicated means only makers with the same "name" field will be allowed in.
   2. "allow_add" means that the app will put relevant things into that box, in case you have a box you only want to put stuff in manually
  
   3. 
   ```json
    {
        "boxes": [
            {
                "name": "Box 5",
                "label": "B5",
                "capacity": 81,
                "height": 9,
                "width": 9,
                "dedicated": false,
                "allow_add": true
            }
        ]
    }
    ```

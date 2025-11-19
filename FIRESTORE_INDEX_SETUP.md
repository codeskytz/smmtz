# Firestore Index Setup

## Why Do We Need an Index?

When querying Firestore with multiple conditions (like `where('enabled', '==', true)` and `orderBy('category')`), Firestore requires a composite index for optimal performance.

## Automatic Index Creation

Firestore will automatically prompt you to create the index when you first run the query. You'll see an error like:

```
The query requires an index. You can create it here: https://console.firebase.google.com/...
```

Simply click the link and Firestore will create the index for you.

## Manual Index Creation

### Option 1: Using Firebase Console

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project
3. Go to **Firestore Database** → **Indexes** tab
4. Click **Create Index**
5. Set:
   - Collection ID: `services`
   - Fields to index:
     - `enabled` (Ascending)
     - `category` (Ascending)
6. Click **Create**

### Option 2: Using Firebase CLI

1. Install Firebase CLI:
   ```bash
   npm install -g firebase-tools
   ```

2. Login:
   ```bash
   firebase login
   ```

3. Initialize (if not already):
   ```bash
   firebase init firestore
   ```

4. Deploy indexes:
   ```bash
   firebase deploy --only firestore:indexes
   ```

### Option 3: Using firestore.indexes.json

The `firestore.indexes.json` file is already configured. Deploy it:

```bash
firebase deploy --only firestore:indexes
```

## Fallback Behavior

The Services component has a fallback that will:
1. Try to use the indexed query first
2. If the index doesn't exist, fetch all services and filter in memory
3. This ensures the app works even without the index (though it's less efficient)

## Verify Index is Created

1. Go to Firebase Console → Firestore → Indexes
2. Look for an index on `services` collection with:
   - `enabled` (Ascending)
   - `category` (Ascending)
3. Status should be "Enabled"

## Troubleshooting

### "Index required" error persists

- Wait a few minutes after creating the index (it takes time to build)
- Check the index status in Firebase Console
- Make sure you're querying the correct collection name (`services`)

### Query still slow

- The index might still be building (can take several minutes)
- Check index status in Firebase Console
- Consider adding more specific filters


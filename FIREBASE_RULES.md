# Firebase Realtime Database Rules

## Required Security Rules

Copy these rules to **Firebase Console → Realtime Database → Rules**:

```json
{
  "rules": {
    "users": {
      ".read": "auth != null",
      ".write": "auth != null"
    },
    "usernames": {
      ".read": "auth != null",
      ".write": "auth != null"
    },
    "phones": {
      ".read": "auth != null",
      ".write": "auth != null"
    },
    "emails": {
      ".read": "auth != null",
      ".write": "auth != null"
    },
    "presence": {
      ".read": "auth != null",
      ".write": "auth != null"
    },
    "chats": {
      "$chatId": {
        ".read": "auth != null && (!data.exists() || data.child('participants').hasChild(auth.uid))",
        ".write": "auth != null && (
          (!data.exists() && newData.child('participants').hasChild(auth.uid)) ||
          (data.exists() && data.child('participants').hasChild(auth.uid))
        )"
      }
    },
    "messages": {
      ".read": "auth != null",
      ".write": "auth != null"
    },
    "userChats": {
      "$uid": {
        ".read": "auth != null && $uid === auth.uid",
        ".write": "auth != null",
        "$chatId": {
          ".read": "auth != null && $uid === auth.uid",
          ".write": "auth != null"
        }
      }
    },
    "typing": {
      ".read": "auth != null",
      ".write": "auth != null"
    },
    "blocks": {
      ".read": "auth != null",
      ".write": "auth != null"
    }
  }
}
```

## Important Notes

### ✅ No Indexes Needed!

**We use lookup nodes** (`emails/`, `usernames/`, `phones/`) which are **direct key lookups (O(1))**. These do **NOT require indexes**.

### ⚠️ Why This Works

- `emails/saurabh_AT_gmail_DOT_com` → Direct key lookup (instant)
- `usernames/johndoe` → Direct key lookup (instant)
- `phones/1234567890` → Direct key lookup (instant)

**We NEVER use `orderByChild()` queries** which would require indexes.

### 🔒 Security

- All reads/writes require authentication (`auth != null`)
- Users can only **read** their own `userChats` (write is allowed for chat creation)
- Chat access is restricted to participants only
- Chat creation requires user to be in participants list

### 📝 Testing Rules

After updating rules, test in Firebase Console → Realtime Database → Rules → Simulator


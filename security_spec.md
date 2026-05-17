# NEXO Security Specification

## Data Invariants
1. A user can only have one shop.
2. A product must belong to a shop that belongs to the user.
3. Statuses expire in 24 hours (enforced by application logic, but rules should restrict who can create them).
4. Messaging is restricted to parties in the conversation.
5. Plan limits (5 products for Basic, 50 for Premium) must be respected (though rules are better at identity than business counts, we'll try to prevent shadow writes).

## The Dirty Dozen (Attack Payloads)
1. **Identity Spoof**: User A tries to create a shop with `ownerId: UserB`.
2. **Shop Hijack**: User A tries to update User B's shop slug.
3. **Product Injection**: User A tries to add a product to User B's shop.
4. **Status Spam**: User on Basic plan trying to create a status.
5. **Private Message Leak**: User A trying to read messages in Conversation(B, C).
6. **Like Forgery**: User A trying to like a product 100 times by bypassing the unique like constraint.
7. **Comment Spoof**: User A posting a comment with `authorName: "Admin"`.
8. **Plan Escalation**: User A trying to update their own `plan: "nexo"`.
9. **Admin Spoof**: User A trying to update `isAdmin: true` on their profile.
10. **ID Poisoning**: Creating a product with a 2MB string as ID.
11. **Shadow Field**: Adding `isVerified: true` to a shop update.
12. **Future Timestamp**: Setting `createdAt` to year 2099 instead of `request.time`.

## Test Runner
(A `firestore.rules.test.ts` would be here in a real environment with local emulator, but we will focus on the rules logic).

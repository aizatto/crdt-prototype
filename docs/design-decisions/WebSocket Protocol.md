# WebSocket Protocol

Disclaimer: This is still a work in progress, I am using this document as a means to externalize my thought process.

# Should one call contain only one command, or multiple commands?

Multiple Commands:

Pros:
- Reduces number of calls to `send`
- Easier to just send a whole batch of inserts / updates
  - How do we handle errors?

Cons:
- Is this increasing complexity?

Alternatives:
- Overload arguments in a single command

Why do I want to support Multiple Commands in a single `send`?
- So that I can batch different commands together, without waiting for a response. For example:
  - Loading and Setting the ID

Concerns:
- How big can a message be?
- How can my server send multiple commands back?

# How do I handle the offset?
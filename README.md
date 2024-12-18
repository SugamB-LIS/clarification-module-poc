# clarification-module-poc

POC - Clarification module on langgraph JS

## Description

We need a capability in js to interact with users to clarify user’s intention and query.

Scenario:

User: Show me the performance of Last year?

Inteliome (JS): What do you mean when you say performance?

User: When I say performance it means sales and profit.

Inteliome (JS): Noted. So you want to see the sales and profit performance of Last year?

JS should merge the context above and prepare a single question to send to core.

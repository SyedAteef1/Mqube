<!--
  Project      : TILEFLOW Retail OS
  Repository   : TILEFLOWRetailNX

  Founders

  * Pushpa Devi Jawahar Mallah
    * Founder & Chairperson
    * Phone: +91 9324117007

  * Syed Ateef
    * Founder, Chief Executive Officer (CEO) & Chief Software Architect


  * Version    : 2.1.1
  * Created    : 2026-07-10
  * Modified   : 2026-07-11
  * License    : MIT Open Source License
-->

# TILEFLOW Platform Adapter Rules (SPAR)

**Status:** ASPIRATIONAL / TARGET FUTURE ARCHITECTURE (Under Research & Development)

> [!NOTE]
> **Scope & Prototype Notice:** This document outlines the long-term target architecture for the production system and is not active in this v2.1.2 standalone prototype. It represents a planned migration target for the TILEFLOW Platform Abstraction Layer (PAL).

This document defines the conceptual implementation mapping between the **TILEFLOW Platform Abstraction Layer (PAL)** and the underlying framework. Only adapter implementations may access the framework directly. All business services must remain framework-independent.

## Long-Term Target Architecture

* **Target Architecture:** Modular Microservices Platform
* **Roadmap:** [PLATFORM_2.md](./PLATFORM_2.md)

This file currently documents the adapter rules for the existing hybrid platform. The roadmap describes the future transition toward a modular microservices architecture.

---

## 1. Current Platform Adapter Stack
* **Underlying Framework:** FastAPI (Python)
* **Underlying Database:** PostgreSQL
* **Client UI Runtime:** React 18 + Vite

---

## 2. Python Platform Adapter Mapping

All direct calls to the underlying framework APIs are strictly prohibited in business logic services, studios, APIs, or data models. They are allowed ONLY within the platform adapter implementation (`core/platform/`).

### Forbidden patterns in business services:
```python
# VIOLATIONS — direct DB or ORM access bypassing the service layer:
db.execute("SELECT * FROM customer")   # raw SQL outside repository layer
SessionLocal()                          # direct session creation in business logic
```

### Approved PAL wrappers (TILEFLOW Platform Abstraction Layer):
All business service code must utilize the TILEFLOW PAL interface:
```python
from tileflow_retail_os import tileflow

# CORRECT PATTERN:
customer = tileflow.documents.get("Customer", name)
value    = tileflow.db.get("Customer", name, "credit_limit")
data     = tileflow.cache.get_or_set("key", lambda: build_data(), ttl=300)
tileflow.events.publish("tileflow:stock_update", {"item": item_code})
tileflow.jobs.enqueue("tileflow_retail_os.services.sync.run", company=company)
tileflow.errors.raise_validation("Field Required", "Please fill in all required fields.")
tileflow.permissions.require("Customer", "read")
```

---

## 3. Client JavaScript Platform Adapter Mapping

Client applications must communicate with server-side endpoints exclusively using the TILEFLOW JavaScript SDK. Direct framework-specific requests or message publishers are forbidden outside the SDK.

### Forbidden direct client calls:
```javascript
// VIOLATIONS — bypass apiFetchV1:
fetch("/api/v1/...");                    // raw fetch
new XMLHttpRequest();                   // XHR
axios.get("/api/v1/...");               // direct axios outside helper
```

### Approved TILEFLOW JavaScript SDK usages:
```javascript
// CORRECT PATTERN:
tileflow.api.call("tileflow_retail_os.module.method", { arg })
  .then(data => tileflow.notify.success("Done", "Action completed."))
  .catch(err => tileflow.notify.error("Failed", err.message));

tileflow.navigation.go(tileflow.navigation.routes.customers);
tileflow.dialog.confirm("Delete?", "This cannot be undone.", () => doDelete());
tileflow.events.on("tileflow:stock_update", data => refreshDisplay(data));
```

---

## 4. Platform Model Configuration

To add a new business concept, map it inside `tileflow_retail_os/core/platform/document_map.yaml`:
```yaml
MyModel:
  platform: "Platform DocType Name"
  description: "What this model represents"
```

The registry will automatically resolve the mapping through the **TILEFLOW Platform Abstraction Layer (PAL)**.

---

## 5. Service Extensions
All domain business services must extend `BaseService` from `tileflow_retail_os.core.services` to inherit standard validation and security controls:
```python
from tileflow_retail_os.core.services import BaseService
from tileflow_retail_os import tileflow

class MyService(BaseService):
    MODEL = "MyModel"

    def do_something(self, name: str):
        self._require_read()   # Raises PermissionError if not allowed
        self._validate_required({"Name": name})
        doc = tileflow.documents.get(self.MODEL, name)
        # Business logic here
        return doc.as_dict()
```


# Contributing to TILEFLOW Retail OS

First of all, thank you for taking the time to contribute.

TILEFLOW Retail OS is an enterprise-grade retail operating system designed for the Indian retail ecosystem. Every contribution—whether code, documentation, testing, design, or feedback—helps improve the platform for thousands of businesses.

---


Our mission is simple:

> Build the most intelligent, reliable, explainable and business-friendly Retail Operating System for India.

Every contribution should align with this vision.

---

# Ways You Can Contribute

You can contribute by:

- Bug Fixes
- New Features
- Documentation
- UI / UX Improvements
- Performance Optimization
- Security Improvements
- Test Cases
- Localization
- Accessibility
- Developer Experience
- Knowledge Base Articles

---

# Before Opening an Issue

Please check:

- Existing Issues
- Existing Pull Requests
- Documentation

Avoid duplicate reports whenever possible.

---

# Reporting Bugs

Please include:

- TILEFLOW Version
- Browser
- Operating System
- Steps to Reproduce
- Expected Behaviour
- Actual Behaviour
- Screenshots (if applicable)
- Logs (if available)

---

# Feature Requests

A good feature request should answer:

- What business problem does it solve?
- Who benefits?
- Expected workflow
- Expected business value

Business-first features are preferred over technology-first features.

---

# Development Workflow

## 1. Fork Repository

Fork the repository to your own GitHub account.

---

## 2. Create Branch

```bash
git checkout -b feature/your-feature
```

Examples

```
feature/customer-wallet
feature/loyalty-engine
fix/invoice-rounding
docs/setup-guide
```

---

## 3. Make Changes

Keep commits focused.

Avoid mixing multiple unrelated changes.

---

## 4. Test Everything

Before submitting:

- Existing tests pass
- New tests added where appropriate
- No lint errors
- No formatting issues

---

## 5. Commit

Use Conventional Commits.

Examples

```
feat(pos): add customer wallet support

fix(gst): correct GST rounding

docs(api): update billing endpoints

refactor(stock): simplify valuation logic

test(pos): add invoice cancellation tests
```

---

## 6. Push

```bash
git push origin feature/your-feature
```

---

## 7. Open Pull Request

Include:

- Summary
- Screenshots (if UI)
- Test Results
- Related Issues

---

# Coding Standards

Please follow the existing project architecture.

Code should be:

- Readable
- Maintainable
- Modular
- Well documented
- Production ready

Avoid unnecessary complexity.

---

# Architecture Principles

Contributors should preserve:

- Explainability First
- Business First Design
- Offline First Philosophy
- Backward Compatibility
- Modular Architecture
- Performance
- Security
- Stability

## TILEFLOW Core Framework — Platform Adapter Rule

**Every contribution must follow the platform adapter boundary.**

### Python — where to put platform calls

| Layer | Allowed | Forbidden |
|---|---|---|
| Business service / studio / API | `from tileflow_retail_os import tileflow` | Direct DB/ORM calls bypassing service layer |
| `core/platform/` only | `SessionLocal()`, repository calls | Raw SQL outside repository |
| Repository layer | Delegates to `tileflow.core.platform` | Direct session creation in business logic |

**Correct pattern in a business service:**
```python
from tileflow_retail_os import tileflow

# Good — routes through Framework API
customer = tileflow.documents.get("Customer", name)
tileflow.cache.set("tileflow_pos_profiles", data, ttl=600)
tileflow.errors.raise_validation("Supplier Required", "Please select a supplier.")
```

**Forbidden in a business service:**
```python
# VIOLATION — raw DB access outside repository layer:
db.execute("SELECT * FROM customer")   # Guard will flag this
```

### Adding a new TILEFLOW model

To map a new business model to a platform DocType, add one entry to `core/platform/document_map.yaml`:
```yaml
MyModel:
  platform: "My DocType Name"
  description: "Brief description"
```
No Python changes required.

### JavaScript — all www/ pages

```javascript
// Correct
tileflow.api.call("tileflow_retail_os.my_api.method", { arg })
  .then(data => tileflow.notify.success("Done", "Action completed."))
  .catch(err => tileflow.notify.error("Failed", err.message));

tileflow.navigation.go(tileflow.navigation.routes.customers);

```javascript
// Forbidden — bypass apiFetchV1:
fetch("/api/v1/...");                    // VIOLATION
new XMLHttpRequest();                   // VIOLATION
axios.get("/api/v1/...");               // VIOLATION
```

Reference: `ARCHITECTURE.md §15`, `docs/implementation/foundation/TILEFLOW_Core_Framework_v1.0.md`

---

# Documentation Standards

Every new feature should include:

- User Documentation
- Technical Documentation
- Configuration Notes
- Upgrade Notes (if required)

Documentation is considered part of the feature.

---

# Testing Standards

All contributions should aim to include:

- Unit Tests
- Integration Tests
- Regression Tests (where applicable)

Never intentionally reduce test coverage.

---

# Security

Please do NOT disclose security vulnerabilities publicly.

Instead:

- Open a private security report.
- Provide reproduction steps.
- Allow maintainers time to investigate.

---

# Pull Request Checklist

Before submitting, verify:

- Code builds successfully
- Tests pass
- Documentation updated
- Screenshots included (UI changes)
- No sensitive data committed
- No unnecessary files included

---

# Commit Message Guidelines

Preferred format:

```
type(scope): description
```

Examples

```
feat(pos): add split payment

fix(stock): correct valuation

docs(api): improve authentication guide

test(cge): add loyalty rule tests

refactor(invoice): simplify calculation flow
```

---

# Code of Conduct

We expect contributors to:

- Be respectful
- Be constructive
- Welcome feedback
- Help others
- Keep discussions professional

Harassment or abusive behaviour will not be tolerated.

---



---

# Credits

TILEFLOW Retail OS

Designed & Architected by the Syed Ateef.

---

# Thank You

Every contribution—no matter how small—helps make TILEFLOW Retail OS better for the global retail community.

We sincerely appreciate your support.

**Happy Coding! 🚀**

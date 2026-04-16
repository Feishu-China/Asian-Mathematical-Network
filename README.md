# Asian-Mathematical-Network

This repository currently serves as the planning and specification workspace for Asiamath.

## Current Focus

- Product documents live in `docs/product/`
- External reference artifacts such as the stakeholder system map live in `docs/reference/`
- Design and technical specs live in `docs/specs/`
- Planning artifacts such as structured breakdown files belong in `docs/planning/`
- The earlier Flask + SQLite prototype has been archived under `archive/legacy-flask/`

## Repository Structure

```text
Asian-Mathematical-Network/
├── archive/
│   └── legacy-flask/     # Archived Flask prototype and SQLite schema
├── docs/
│   ├── archive/          # Older documentation versions
│   ├── planning/         # Structured planning assets
│   ├── product/          # PRDs and product-level scope docs
│   ├── reference/        # External inputs and baseline reference artifacts
│   └── specs/            # Design, technical, API, and schema specs
├── LICENSE
└── README.md
```

## Legacy Prototype

The archived Flask prototype is no longer the active product direction. It is kept only for reference.

If you need to inspect or run it:

```bash
cd archive/legacy-flask
python app.py
```

## License

This project is licensed under the Apache-2.0 License. See `LICENSE` for details.

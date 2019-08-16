.PHONY: check test all

#: "Build" this - really just an "npm install"
all:
	npm install

# Note: most things are just npm and the target name

#: Run tests
check:
	npm run test && $(MAKE) coverage-text

#: lint (tslint) Typescript source code
lint:
	npm run lint

test: check

#: Compile typescript to javascript
build:
	npx tsc --build

#: clear out node_modules
clean:
	rm -fr node_modules out || true

# "nyc report" is not working for me inside a package.json script.
# (It might just be me and an environment thing...)
# But for now we do it explicitly here as a workaround rather than call npm.

#: Show coverage report in text format with boxy graphics
coverage-text:
	nyc report --reporter=text

#: Produce coverage report in HTML (no console output0
coverage-html:
	nyc report --reporter=html

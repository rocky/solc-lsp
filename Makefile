.PHONY: check test

# Note: most things are just npm and the target name

#: Run tests
check:
	npm test

test: check

#: Compile typescript to javascript
build:
	tsc --build

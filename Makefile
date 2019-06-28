.PHONY: check

# Note: most things are just npm and the target name

#: Run tests
check:
	npm test

#: Compile typescript to javascript
build:
	npm build

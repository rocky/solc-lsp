# Whatever it is you want to do, it should be forwarded to the
# to top-level directories
.PHONY: build check

build:
	$(MAKE) -C .. $@

check: build
	$(MAKE) -C .. $@

%:
	$(MAKE) -C .. $@

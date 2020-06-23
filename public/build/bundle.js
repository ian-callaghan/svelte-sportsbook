
(function(l, r) { if (l.getElementById('livereloadscript')) return; r = l.createElement('script'); r.async = 1; r.src = '//' + (window.location.host || 'localhost').split(':')[0] + ':35729/livereload.js?snipver=1'; r.id = 'livereloadscript'; l.getElementsByTagName('head')[0].appendChild(r) })(window.document);
var app = (function () {
    'use strict';

    function noop() { }
    function assign(tar, src) {
        // @ts-ignore
        for (const k in src)
            tar[k] = src[k];
        return tar;
    }
    function add_location(element, file, line, column, char) {
        element.__svelte_meta = {
            loc: { file, line, column, char }
        };
    }
    function run(fn) {
        return fn();
    }
    function blank_object() {
        return Object.create(null);
    }
    function run_all(fns) {
        fns.forEach(run);
    }
    function is_function(thing) {
        return typeof thing === 'function';
    }
    function safe_not_equal(a, b) {
        return a != a ? b == b : a !== b || ((a && typeof a === 'object') || typeof a === 'function');
    }
    function create_slot(definition, ctx, $$scope, fn) {
        if (definition) {
            const slot_ctx = get_slot_context(definition, ctx, $$scope, fn);
            return definition[0](slot_ctx);
        }
    }
    function get_slot_context(definition, ctx, $$scope, fn) {
        return definition[1] && fn
            ? assign($$scope.ctx.slice(), definition[1](fn(ctx)))
            : $$scope.ctx;
    }
    function get_slot_changes(definition, $$scope, dirty, fn) {
        if (definition[2] && fn) {
            const lets = definition[2](fn(dirty));
            if ($$scope.dirty === undefined) {
                return lets;
            }
            if (typeof lets === 'object') {
                const merged = [];
                const len = Math.max($$scope.dirty.length, lets.length);
                for (let i = 0; i < len; i += 1) {
                    merged[i] = $$scope.dirty[i] | lets[i];
                }
                return merged;
            }
            return $$scope.dirty | lets;
        }
        return $$scope.dirty;
    }
    function update_slot(slot, slot_definition, ctx, $$scope, dirty, get_slot_changes_fn, get_slot_context_fn) {
        const slot_changes = get_slot_changes(slot_definition, $$scope, dirty, get_slot_changes_fn);
        if (slot_changes) {
            const slot_context = get_slot_context(slot_definition, ctx, $$scope, get_slot_context_fn);
            slot.p(slot_context, slot_changes);
        }
    }
    function exclude_internal_props(props) {
        const result = {};
        for (const k in props)
            if (k[0] !== '$')
                result[k] = props[k];
        return result;
    }
    function null_to_empty(value) {
        return value == null ? '' : value;
    }

    function append(target, node) {
        target.appendChild(node);
    }
    function insert(target, node, anchor) {
        target.insertBefore(node, anchor || null);
    }
    function detach(node) {
        node.parentNode.removeChild(node);
    }
    function element(name) {
        return document.createElement(name);
    }
    function text(data) {
        return document.createTextNode(data);
    }
    function space() {
        return text(' ');
    }
    function attr(node, attribute, value) {
        if (value == null)
            node.removeAttribute(attribute);
        else if (node.getAttribute(attribute) !== value)
            node.setAttribute(attribute, value);
    }
    function children(element) {
        return Array.from(element.childNodes);
    }
    function toggle_class(element, name, toggle) {
        element.classList[toggle ? 'add' : 'remove'](name);
    }
    function custom_event(type, detail) {
        const e = document.createEvent('CustomEvent');
        e.initCustomEvent(type, false, false, detail);
        return e;
    }

    let current_component;
    function set_current_component(component) {
        current_component = component;
    }

    const dirty_components = [];
    const binding_callbacks = [];
    const render_callbacks = [];
    const flush_callbacks = [];
    const resolved_promise = Promise.resolve();
    let update_scheduled = false;
    function schedule_update() {
        if (!update_scheduled) {
            update_scheduled = true;
            resolved_promise.then(flush);
        }
    }
    function add_render_callback(fn) {
        render_callbacks.push(fn);
    }
    let flushing = false;
    const seen_callbacks = new Set();
    function flush() {
        if (flushing)
            return;
        flushing = true;
        do {
            // first, call beforeUpdate functions
            // and update components
            for (let i = 0; i < dirty_components.length; i += 1) {
                const component = dirty_components[i];
                set_current_component(component);
                update(component.$$);
            }
            dirty_components.length = 0;
            while (binding_callbacks.length)
                binding_callbacks.pop()();
            // then, once components are updated, call
            // afterUpdate functions. This may cause
            // subsequent updates...
            for (let i = 0; i < render_callbacks.length; i += 1) {
                const callback = render_callbacks[i];
                if (!seen_callbacks.has(callback)) {
                    // ...so guard against infinite loops
                    seen_callbacks.add(callback);
                    callback();
                }
            }
            render_callbacks.length = 0;
        } while (dirty_components.length);
        while (flush_callbacks.length) {
            flush_callbacks.pop()();
        }
        update_scheduled = false;
        flushing = false;
        seen_callbacks.clear();
    }
    function update($$) {
        if ($$.fragment !== null) {
            $$.update();
            run_all($$.before_update);
            const dirty = $$.dirty;
            $$.dirty = [-1];
            $$.fragment && $$.fragment.p($$.ctx, dirty);
            $$.after_update.forEach(add_render_callback);
        }
    }
    const outroing = new Set();
    let outros;
    function transition_in(block, local) {
        if (block && block.i) {
            outroing.delete(block);
            block.i(local);
        }
    }
    function transition_out(block, local, detach, callback) {
        if (block && block.o) {
            if (outroing.has(block))
                return;
            outroing.add(block);
            outros.c.push(() => {
                outroing.delete(block);
                if (callback) {
                    if (detach)
                        block.d(1);
                    callback();
                }
            });
            block.o(local);
        }
    }
    function create_component(block) {
        block && block.c();
    }
    function mount_component(component, target, anchor) {
        const { fragment, on_mount, on_destroy, after_update } = component.$$;
        fragment && fragment.m(target, anchor);
        // onMount happens before the initial afterUpdate
        add_render_callback(() => {
            const new_on_destroy = on_mount.map(run).filter(is_function);
            if (on_destroy) {
                on_destroy.push(...new_on_destroy);
            }
            else {
                // Edge case - component was destroyed immediately,
                // most likely as a result of a binding initialising
                run_all(new_on_destroy);
            }
            component.$$.on_mount = [];
        });
        after_update.forEach(add_render_callback);
    }
    function destroy_component(component, detaching) {
        const $$ = component.$$;
        if ($$.fragment !== null) {
            run_all($$.on_destroy);
            $$.fragment && $$.fragment.d(detaching);
            // TODO null out other refs, including component.$$ (but need to
            // preserve final state?)
            $$.on_destroy = $$.fragment = null;
            $$.ctx = [];
        }
    }
    function make_dirty(component, i) {
        if (component.$$.dirty[0] === -1) {
            dirty_components.push(component);
            schedule_update();
            component.$$.dirty.fill(0);
        }
        component.$$.dirty[(i / 31) | 0] |= (1 << (i % 31));
    }
    function init(component, options, instance, create_fragment, not_equal, props, dirty = [-1]) {
        const parent_component = current_component;
        set_current_component(component);
        const prop_values = options.props || {};
        const $$ = component.$$ = {
            fragment: null,
            ctx: null,
            // state
            props,
            update: noop,
            not_equal,
            bound: blank_object(),
            // lifecycle
            on_mount: [],
            on_destroy: [],
            before_update: [],
            after_update: [],
            context: new Map(parent_component ? parent_component.$$.context : []),
            // everything else
            callbacks: blank_object(),
            dirty
        };
        let ready = false;
        $$.ctx = instance
            ? instance(component, prop_values, (i, ret, ...rest) => {
                const value = rest.length ? rest[0] : ret;
                if ($$.ctx && not_equal($$.ctx[i], $$.ctx[i] = value)) {
                    if ($$.bound[i])
                        $$.bound[i](value);
                    if (ready)
                        make_dirty(component, i);
                }
                return ret;
            })
            : [];
        $$.update();
        ready = true;
        run_all($$.before_update);
        // `false` as a special case of no DOM component
        $$.fragment = create_fragment ? create_fragment($$.ctx) : false;
        if (options.target) {
            if (options.hydrate) {
                const nodes = children(options.target);
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                $$.fragment && $$.fragment.l(nodes);
                nodes.forEach(detach);
            }
            else {
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                $$.fragment && $$.fragment.c();
            }
            if (options.intro)
                transition_in(component.$$.fragment);
            mount_component(component, options.target, options.anchor);
            flush();
        }
        set_current_component(parent_component);
    }
    class SvelteComponent {
        $destroy() {
            destroy_component(this, 1);
            this.$destroy = noop;
        }
        $on(type, callback) {
            const callbacks = (this.$$.callbacks[type] || (this.$$.callbacks[type] = []));
            callbacks.push(callback);
            return () => {
                const index = callbacks.indexOf(callback);
                if (index !== -1)
                    callbacks.splice(index, 1);
            };
        }
        $set() {
            // overridden by instance, if it has props
        }
    }

    function dispatch_dev(type, detail) {
        document.dispatchEvent(custom_event(type, Object.assign({ version: '3.23.2' }, detail)));
    }
    function append_dev(target, node) {
        dispatch_dev("SvelteDOMInsert", { target, node });
        append(target, node);
    }
    function insert_dev(target, node, anchor) {
        dispatch_dev("SvelteDOMInsert", { target, node, anchor });
        insert(target, node, anchor);
    }
    function detach_dev(node) {
        dispatch_dev("SvelteDOMRemove", { node });
        detach(node);
    }
    function attr_dev(node, attribute, value) {
        attr(node, attribute, value);
        if (value == null)
            dispatch_dev("SvelteDOMRemoveAttribute", { node, attribute });
        else
            dispatch_dev("SvelteDOMSetAttribute", { node, attribute, value });
    }
    function set_data_dev(text, data) {
        data = '' + data;
        if (text.data === data)
            return;
        dispatch_dev("SvelteDOMSetData", { node: text, data });
        text.data = data;
    }
    function validate_slots(name, slot, keys) {
        for (const slot_key of Object.keys(slot)) {
            if (!~keys.indexOf(slot_key)) {
                console.warn(`<${name}> received an unexpected slot "${slot_key}".`);
            }
        }
    }
    class SvelteComponentDev extends SvelteComponent {
        constructor(options) {
            if (!options || (!options.target && !options.$$inline)) {
                throw new Error(`'target' is a required option`);
            }
            super();
        }
        $destroy() {
            super.$destroy();
            this.$destroy = () => {
                console.warn(`Component was already destroyed`); // eslint-disable-line no-console
            };
        }
        $capture_state() { }
        $inject_state() { }
    }

    /* src/Header.svelte generated by Svelte v3.23.2 */

    const file = "src/Header.svelte";

    function create_fragment(ctx) {
    	let header;
    	let div;
    	let img0;
    	let img0_src_value;
    	let t0;
    	let span0;
    	let t2;
    	let span1;
    	let t4;
    	let img1;
    	let img1_src_value;
    	let t5;
    	let span2;
    	let t7;
    	let span3;

    	const block = {
    		c: function create() {
    			header = element("header");
    			div = element("div");
    			img0 = element("img");
    			t0 = space();
    			span0 = element("span");
    			span0.textContent = "A-Z";
    			t2 = space();
    			span1 = element("span");
    			span1.textContent = "Live";
    			t4 = space();
    			img1 = element("img");
    			t5 = space();
    			span2 = element("span");
    			span2.textContent = "Log In";
    			t7 = space();
    			span3 = element("span");
    			span3.textContent = "Join";
    			attr_dev(img0, "class", "burger-icon svelte-gi7urb");
    			if (img0.src !== (img0_src_value = "/burger.svg")) attr_dev(img0, "src", img0_src_value);
    			attr_dev(img0, "alt", "A-Z menu");
    			add_location(img0, file, 30, 8, 487);
    			attr_dev(span0, "class", "svelte-gi7urb");
    			add_location(span0, file, 31, 8, 556);
    			attr_dev(div, "class", "menu-flex svelte-gi7urb");
    			add_location(div, file, 29, 4, 455);
    			attr_dev(span1, "class", "svelte-gi7urb");
    			add_location(span1, file, 33, 4, 588);
    			if (img1.src !== (img1_src_value = "/logo.svg")) attr_dev(img1, "src", img1_src_value);
    			attr_dev(img1, "alt", "Rivalo brand logo");
    			add_location(img1, file, 34, 4, 610);
    			attr_dev(span2, "class", "svelte-gi7urb");
    			add_location(span2, file, 35, 4, 662);
    			attr_dev(span3, "class", "yellow svelte-gi7urb");
    			add_location(span3, file, 36, 4, 686);
    			attr_dev(header, "class", "svelte-gi7urb");
    			add_location(header, file, 28, 0, 442);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, header, anchor);
    			append_dev(header, div);
    			append_dev(div, img0);
    			append_dev(div, t0);
    			append_dev(div, span0);
    			append_dev(header, t2);
    			append_dev(header, span1);
    			append_dev(header, t4);
    			append_dev(header, img1);
    			append_dev(header, t5);
    			append_dev(header, span2);
    			append_dev(header, t7);
    			append_dev(header, span3);
    		},
    		p: noop,
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(header);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance($$self, $$props) {
    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Header> was created with unknown prop '${key}'`);
    	});

    	let { $$slots = {}, $$scope } = $$props;
    	validate_slots("Header", $$slots, []);
    	return [];
    }

    class Header extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance, create_fragment, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Header",
    			options,
    			id: create_fragment.name
    		});
    	}
    }

    /* src/SectionHeader.svelte generated by Svelte v3.23.2 */

    const file$1 = "src/SectionHeader.svelte";

    function create_fragment$1(ctx) {
    	let div;
    	let span;
    	let t;

    	const block = {
    		c: function create() {
    			div = element("div");
    			span = element("span");
    			t = text(/*name*/ ctx[0]);
    			add_location(span, file$1, 19, 4, 315);
    			attr_dev(div, "class", "svelte-1jeitu8");
    			add_location(div, file$1, 18, 0, 305);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			append_dev(div, span);
    			append_dev(span, t);
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*name*/ 1) set_data_dev(t, /*name*/ ctx[0]);
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$1.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$1($$self, $$props, $$invalidate) {
    	let { name } = $$props;
    	const writable_props = ["name"];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<SectionHeader> was created with unknown prop '${key}'`);
    	});

    	let { $$slots = {}, $$scope } = $$props;
    	validate_slots("SectionHeader", $$slots, []);

    	$$self.$set = $$props => {
    		if ("name" in $$props) $$invalidate(0, name = $$props.name);
    	};

    	$$self.$capture_state = () => ({ name });

    	$$self.$inject_state = $$props => {
    		if ("name" in $$props) $$invalidate(0, name = $$props.name);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [name];
    }

    class SectionHeader extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$1, create_fragment$1, safe_not_equal, { name: 0 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "SectionHeader",
    			options,
    			id: create_fragment$1.name
    		});

    		const { ctx } = this.$$;
    		const props = options.props || {};

    		if (/*name*/ ctx[0] === undefined && !("name" in props)) {
    			console.warn("<SectionHeader> was created without expected prop 'name'");
    		}
    	}

    	get name() {
    		throw new Error("<SectionHeader>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set name(value) {
    		throw new Error("<SectionHeader>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src/SectionSubHeader.svelte generated by Svelte v3.23.2 */

    const file$2 = "src/SectionSubHeader.svelte";

    function create_fragment$2(ctx) {
    	let div;
    	let current;
    	const default_slot_template = /*$$slots*/ ctx[1].default;
    	const default_slot = create_slot(default_slot_template, ctx, /*$$scope*/ ctx[0], null);

    	const block = {
    		c: function create() {
    			div = element("div");
    			if (default_slot) default_slot.c();
    			attr_dev(div, "class", "svelte-1si52su");
    			add_location(div, file$2, 18, 0, 286);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);

    			if (default_slot) {
    				default_slot.m(div, null);
    			}

    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			if (default_slot) {
    				if (default_slot.p && dirty & /*$$scope*/ 1) {
    					update_slot(default_slot, default_slot_template, ctx, /*$$scope*/ ctx[0], dirty, null, null);
    				}
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(default_slot, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(default_slot, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			if (default_slot) default_slot.d(detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$2.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$2($$self, $$props, $$invalidate) {
    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<SectionSubHeader> was created with unknown prop '${key}'`);
    	});

    	let { $$slots = {}, $$scope } = $$props;
    	validate_slots("SectionSubHeader", $$slots, ['default']);

    	$$self.$set = $$props => {
    		if ("$$scope" in $$props) $$invalidate(0, $$scope = $$props.$$scope);
    	};

    	return [$$scope, $$slots];
    }

    class SectionSubHeader extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$2, create_fragment$2, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "SectionSubHeader",
    			options,
    			id: create_fragment$2.name
    		});
    	}
    }

    /* src/FlatButton.svelte generated by Svelte v3.23.2 */

    const file$3 = "src/FlatButton.svelte";

    function create_fragment$3(ctx) {
    	let button;
    	let div1;
    	let t0;
    	let div0;
    	let span;
    	let t1;
    	let t2;
    	let img;
    	let img_src_value;
    	let button_class_value;
    	let current;
    	const default_slot_template = /*$$slots*/ ctx[3].default;
    	const default_slot = create_slot(default_slot_template, ctx, /*$$scope*/ ctx[2], null);

    	const block = {
    		c: function create() {
    			button = element("button");
    			div1 = element("div");
    			if (default_slot) default_slot.c();
    			t0 = space();
    			div0 = element("div");
    			span = element("span");
    			t1 = text(/*amount*/ ctx[0]);
    			t2 = space();
    			img = element("img");
    			add_location(span, file$3, 32, 12, 604);
    			if (img.src !== (img_src_value = "/chevron-right.svg")) attr_dev(img, "src", img_src_value);
    			attr_dev(img, "alt", "A-Z menu");
    			attr_dev(img, "class", "svelte-983p1");
    			add_location(img, file$3, 33, 12, 638);
    			add_location(div0, file$3, 31, 8, 586);
    			attr_dev(div1, "class", "container svelte-983p1");
    			add_location(div1, file$3, 29, 4, 537);
    			attr_dev(button, "class", button_class_value = "" + (null_to_empty(/*$$props*/ ctx[1].class) + " svelte-983p1"));
    			add_location(button, file$3, 28, 0, 502);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, button, anchor);
    			append_dev(button, div1);

    			if (default_slot) {
    				default_slot.m(div1, null);
    			}

    			append_dev(div1, t0);
    			append_dev(div1, div0);
    			append_dev(div0, span);
    			append_dev(span, t1);
    			append_dev(div0, t2);
    			append_dev(div0, img);
    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			if (default_slot) {
    				if (default_slot.p && dirty & /*$$scope*/ 4) {
    					update_slot(default_slot, default_slot_template, ctx, /*$$scope*/ ctx[2], dirty, null, null);
    				}
    			}

    			if (!current || dirty & /*amount*/ 1) set_data_dev(t1, /*amount*/ ctx[0]);

    			if (!current || dirty & /*$$props*/ 2 && button_class_value !== (button_class_value = "" + (null_to_empty(/*$$props*/ ctx[1].class) + " svelte-983p1"))) {
    				attr_dev(button, "class", button_class_value);
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(default_slot, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(default_slot, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(button);
    			if (default_slot) default_slot.d(detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$3.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$3($$self, $$props, $$invalidate) {
    	let { amount = 0 } = $$props;
    	let { $$slots = {}, $$scope } = $$props;
    	validate_slots("FlatButton", $$slots, ['default']);

    	$$self.$set = $$new_props => {
    		$$invalidate(1, $$props = assign(assign({}, $$props), exclude_internal_props($$new_props)));
    		if ("amount" in $$new_props) $$invalidate(0, amount = $$new_props.amount);
    		if ("$$scope" in $$new_props) $$invalidate(2, $$scope = $$new_props.$$scope);
    	};

    	$$self.$capture_state = () => ({ amount });

    	$$self.$inject_state = $$new_props => {
    		$$invalidate(1, $$props = assign(assign({}, $$props), $$new_props));
    		if ("amount" in $$props) $$invalidate(0, amount = $$new_props.amount);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	$$props = exclude_internal_props($$props);
    	return [amount, $$props, $$scope, $$slots];
    }

    class FlatButton extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$3, create_fragment$3, safe_not_equal, { amount: 0 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "FlatButton",
    			options,
    			id: create_fragment$3.name
    		});
    	}

    	get amount() {
    		throw new Error("<FlatButton>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set amount(value) {
    		throw new Error("<FlatButton>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src/Odds.svelte generated by Svelte v3.23.2 */

    const file$4 = "src/Odds.svelte";

    function create_fragment$4(ctx) {
    	let div;
    	let span;
    	let t;

    	const block = {
    		c: function create() {
    			div = element("div");
    			span = element("span");
    			t = text(/*value*/ ctx[0]);
    			add_location(span, file$4, 25, 4, 476);
    			attr_dev(div, "class", "svelte-18j5613");
    			toggle_class(div, "selected", /*selected*/ ctx[1]);
    			add_location(div, file$4, 24, 0, 451);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			append_dev(div, span);
    			append_dev(span, t);
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*value*/ 1) set_data_dev(t, /*value*/ ctx[0]);

    			if (dirty & /*selected*/ 2) {
    				toggle_class(div, "selected", /*selected*/ ctx[1]);
    			}
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$4.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$4($$self, $$props, $$invalidate) {
    	let { value = "0.00" } = $$props;
    	let { selected = false } = $$props;
    	const writable_props = ["value", "selected"];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Odds> was created with unknown prop '${key}'`);
    	});

    	let { $$slots = {}, $$scope } = $$props;
    	validate_slots("Odds", $$slots, []);

    	$$self.$set = $$props => {
    		if ("value" in $$props) $$invalidate(0, value = $$props.value);
    		if ("selected" in $$props) $$invalidate(1, selected = $$props.selected);
    	};

    	$$self.$capture_state = () => ({ value, selected });

    	$$self.$inject_state = $$props => {
    		if ("value" in $$props) $$invalidate(0, value = $$props.value);
    		if ("selected" in $$props) $$invalidate(1, selected = $$props.selected);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [value, selected];
    }

    class Odds extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$4, create_fragment$4, safe_not_equal, { value: 0, selected: 1 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Odds",
    			options,
    			id: create_fragment$4.name
    		});
    	}

    	get value() {
    		throw new Error("<Odds>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set value(value) {
    		throw new Error("<Odds>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get selected() {
    		throw new Error("<Odds>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set selected(value) {
    		throw new Error("<Odds>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src/OddsGroup.svelte generated by Svelte v3.23.2 */

    const file$5 = "src/OddsGroup.svelte";

    function create_fragment$5(ctx) {
    	let div;
    	let current;
    	const default_slot_template = /*$$slots*/ ctx[1].default;
    	const default_slot = create_slot(default_slot_template, ctx, /*$$scope*/ ctx[0], null);

    	const block = {
    		c: function create() {
    			div = element("div");
    			if (default_slot) default_slot.c();
    			attr_dev(div, "class", "svelte-1tuwmas");
    			add_location(div, file$5, 12, 0, 122);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);

    			if (default_slot) {
    				default_slot.m(div, null);
    			}

    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			if (default_slot) {
    				if (default_slot.p && dirty & /*$$scope*/ 1) {
    					update_slot(default_slot, default_slot_template, ctx, /*$$scope*/ ctx[0], dirty, null, null);
    				}
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(default_slot, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(default_slot, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			if (default_slot) default_slot.d(detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$5.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$5($$self, $$props, $$invalidate) {
    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<OddsGroup> was created with unknown prop '${key}'`);
    	});

    	let { $$slots = {}, $$scope } = $$props;
    	validate_slots("OddsGroup", $$slots, ['default']);

    	$$self.$set = $$props => {
    		if ("$$scope" in $$props) $$invalidate(0, $$scope = $$props.$$scope);
    	};

    	return [$$scope, $$slots];
    }

    class OddsGroup extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$5, create_fragment$5, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "OddsGroup",
    			options,
    			id: create_fragment$5.name
    		});
    	}
    }

    /* src/FixtureGroup.svelte generated by Svelte v3.23.2 */
    const file$6 = "src/FixtureGroup.svelte";

    // (55:4) <OddsGroup>
    function create_default_slot(ctx) {
    	let div0;
    	let odds0;
    	let t0;
    	let div1;
    	let odds1;
    	let t1;
    	let div2;
    	let odds2;
    	let current;
    	odds0 = new Odds({ props: { value: "2.00" }, $$inline: true });
    	odds1 = new Odds({ props: { value: "3.75" }, $$inline: true });

    	odds2 = new Odds({
    			props: { value: "2.00", selected: true },
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			div0 = element("div");
    			create_component(odds0.$$.fragment);
    			t0 = space();
    			div1 = element("div");
    			create_component(odds1.$$.fragment);
    			t1 = space();
    			div2 = element("div");
    			create_component(odds2.$$.fragment);
    			attr_dev(div0, "class", "odds svelte-1ib0h0s");
    			add_location(div0, file$6, 55, 8, 1175);
    			attr_dev(div1, "class", "odds svelte-1ib0h0s");
    			add_location(div1, file$6, 58, 8, 1251);
    			attr_dev(div2, "class", "odds svelte-1ib0h0s");
    			add_location(div2, file$6, 61, 8, 1327);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div0, anchor);
    			mount_component(odds0, div0, null);
    			insert_dev(target, t0, anchor);
    			insert_dev(target, div1, anchor);
    			mount_component(odds1, div1, null);
    			insert_dev(target, t1, anchor);
    			insert_dev(target, div2, anchor);
    			mount_component(odds2, div2, null);
    			current = true;
    		},
    		p: noop,
    		i: function intro(local) {
    			if (current) return;
    			transition_in(odds0.$$.fragment, local);
    			transition_in(odds1.$$.fragment, local);
    			transition_in(odds2.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(odds0.$$.fragment, local);
    			transition_out(odds1.$$.fragment, local);
    			transition_out(odds2.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div0);
    			destroy_component(odds0);
    			if (detaching) detach_dev(t0);
    			if (detaching) detach_dev(div1);
    			destroy_component(odds1);
    			if (detaching) detach_dev(t1);
    			if (detaching) detach_dev(div2);
    			destroy_component(odds2);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot.name,
    		type: "slot",
    		source: "(55:4) <OddsGroup>",
    		ctx
    	});

    	return block;
    }

    function create_fragment$6(ctx) {
    	let div3;
    	let div2;
    	let div0;
    	let span0;
    	let t1;
    	let span1;
    	let t3;
    	let div1;
    	let span2;
    	let t5;
    	let span3;
    	let t7;
    	let span4;
    	let t9;
    	let oddsgroup;
    	let current;

    	oddsgroup = new OddsGroup({
    			props: {
    				$$slots: { default: [create_default_slot] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			div3 = element("div");
    			div2 = element("div");
    			div0 = element("div");
    			span0 = element("span");
    			span0.textContent = "1";
    			t1 = space();
    			span1 = element("span");
    			span1.textContent = "Eintracht Frankfurt";
    			t3 = space();
    			div1 = element("div");
    			span2 = element("span");
    			span2.textContent = "0";
    			t5 = space();
    			span3 = element("span");
    			span3.textContent = "SC Freiburg";
    			t7 = space();
    			span4 = element("span");
    			span4.textContent = "11' 14";
    			t9 = space();
    			create_component(oddsgroup.$$.fragment);
    			attr_dev(span0, "class", "score svelte-1ib0h0s");
    			add_location(span0, file$6, 45, 12, 883);
    			add_location(span1, file$6, 46, 12, 924);
    			attr_dev(div0, "class", "team svelte-1ib0h0s");
    			add_location(div0, file$6, 44, 8, 852);
    			attr_dev(span2, "class", "score svelte-1ib0h0s");
    			add_location(span2, file$6, 49, 12, 1018);
    			add_location(span3, file$6, 50, 12, 1059);
    			attr_dev(div1, "class", "team team-b svelte-1ib0h0s");
    			add_location(div1, file$6, 48, 8, 980);
    			attr_dev(span4, "class", "info svelte-1ib0h0s");
    			add_location(span4, file$6, 52, 8, 1107);
    			attr_dev(div2, "class", "details svelte-1ib0h0s");
    			add_location(div2, file$6, 43, 4, 822);
    			attr_dev(div3, "class", "container svelte-1ib0h0s");
    			add_location(div3, file$6, 42, 0, 794);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div3, anchor);
    			append_dev(div3, div2);
    			append_dev(div2, div0);
    			append_dev(div0, span0);
    			append_dev(div0, t1);
    			append_dev(div0, span1);
    			append_dev(div2, t3);
    			append_dev(div2, div1);
    			append_dev(div1, span2);
    			append_dev(div1, t5);
    			append_dev(div1, span3);
    			append_dev(div2, t7);
    			append_dev(div2, span4);
    			append_dev(div3, t9);
    			mount_component(oddsgroup, div3, null);
    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			const oddsgroup_changes = {};

    			if (dirty & /*$$scope*/ 1) {
    				oddsgroup_changes.$$scope = { dirty, ctx };
    			}

    			oddsgroup.$set(oddsgroup_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(oddsgroup.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(oddsgroup.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div3);
    			destroy_component(oddsgroup);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$6.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$6($$self, $$props, $$invalidate) {
    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<FixtureGroup> was created with unknown prop '${key}'`);
    	});

    	let { $$slots = {}, $$scope } = $$props;
    	validate_slots("FixtureGroup", $$slots, []);
    	$$self.$capture_state = () => ({ Odds, OddsGroup });
    	return [];
    }

    class FixtureGroup extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$6, create_fragment$6, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "FixtureGroup",
    			options,
    			id: create_fragment$6.name
    		});
    	}
    }

    /* src/HomeAwayHeader.svelte generated by Svelte v3.23.2 */
    const file$7 = "src/HomeAwayHeader.svelte";

    // (23:4) <OddsGroup>
    function create_default_slot$1(ctx) {
    	let div0;
    	let t1;
    	let div1;
    	let t3;
    	let div2;

    	const block = {
    		c: function create() {
    			div0 = element("div");
    			div0.textContent = "1";
    			t1 = space();
    			div1 = element("div");
    			div1.textContent = "X";
    			t3 = space();
    			div2 = element("div");
    			div2.textContent = "2";
    			attr_dev(div0, "class", "odds svelte-1keux75");
    			add_location(div0, file$7, 23, 8, 422);
    			attr_dev(div1, "class", "odds svelte-1keux75");
    			add_location(div1, file$7, 24, 8, 456);
    			attr_dev(div2, "class", "odds svelte-1keux75");
    			add_location(div2, file$7, 25, 8, 490);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div0, anchor);
    			insert_dev(target, t1, anchor);
    			insert_dev(target, div1, anchor);
    			insert_dev(target, t3, anchor);
    			insert_dev(target, div2, anchor);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div0);
    			if (detaching) detach_dev(t1);
    			if (detaching) detach_dev(div1);
    			if (detaching) detach_dev(t3);
    			if (detaching) detach_dev(div2);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot$1.name,
    		type: "slot",
    		source: "(23:4) <OddsGroup>",
    		ctx
    	});

    	return block;
    }

    function create_fragment$7(ctx) {
    	let div;
    	let span;
    	let t0;
    	let t1;
    	let oddsgroup;
    	let current;

    	oddsgroup = new OddsGroup({
    			props: {
    				$$slots: { default: [create_default_slot$1] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			div = element("div");
    			span = element("span");
    			t0 = text(/*title*/ ctx[0]);
    			t1 = space();
    			create_component(oddsgroup.$$.fragment);
    			add_location(span, file$7, 21, 4, 377);
    			attr_dev(div, "class", "header-details svelte-1keux75");
    			add_location(div, file$7, 20, 0, 344);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			append_dev(div, span);
    			append_dev(span, t0);
    			append_dev(div, t1);
    			mount_component(oddsgroup, div, null);
    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			if (!current || dirty & /*title*/ 1) set_data_dev(t0, /*title*/ ctx[0]);
    			const oddsgroup_changes = {};

    			if (dirty & /*$$scope*/ 2) {
    				oddsgroup_changes.$$scope = { dirty, ctx };
    			}

    			oddsgroup.$set(oddsgroup_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(oddsgroup.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(oddsgroup.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			destroy_component(oddsgroup);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$7.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$7($$self, $$props, $$invalidate) {
    	let { title = "" } = $$props;
    	const writable_props = ["title"];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<HomeAwayHeader> was created with unknown prop '${key}'`);
    	});

    	let { $$slots = {}, $$scope } = $$props;
    	validate_slots("HomeAwayHeader", $$slots, []);

    	$$self.$set = $$props => {
    		if ("title" in $$props) $$invalidate(0, title = $$props.title);
    	};

    	$$self.$capture_state = () => ({ OddsGroup, title });

    	$$self.$inject_state = $$props => {
    		if ("title" in $$props) $$invalidate(0, title = $$props.title);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [title];
    }

    class HomeAwayHeader extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$7, create_fragment$7, safe_not_equal, { title: 0 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "HomeAwayHeader",
    			options,
    			id: create_fragment$7.name
    		});
    	}

    	get title() {
    		throw new Error("<HomeAwayHeader>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set title(value) {
    		throw new Error("<HomeAwayHeader>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src/Advert.svelte generated by Svelte v3.23.2 */

    const file$8 = "src/Advert.svelte";

    function create_fragment$8(ctx) {
    	let div;

    	const block = {
    		c: function create() {
    			div = element("div");
    			attr_dev(div, "class", "svelte-1jkjcik");
    			add_location(div, file$8, 12, 0, 128);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    		},
    		p: noop,
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$8.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$8($$self, $$props) {
    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Advert> was created with unknown prop '${key}'`);
    	});

    	let { $$slots = {}, $$scope } = $$props;
    	validate_slots("Advert", $$slots, []);
    	return [];
    }

    class Advert extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$8, create_fragment$8, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Advert",
    			options,
    			id: create_fragment$8.name
    		});
    	}
    }

    /* src/App.svelte generated by Svelte v3.23.2 */
    const file$9 = "src/App.svelte";

    // (50:8) <FlatButton amount="34">
    function create_default_slot_4(ctx) {
    	let t;

    	const block = {
    		c: function create() {
    			t = text("Premier League");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, t, anchor);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(t);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot_4.name,
    		type: "slot",
    		source: "(50:8) <FlatButton amount=\\\"34\\\">",
    		ctx
    	});

    	return block;
    }

    // (51:8) <FlatButton amount="42">
    function create_default_slot_3(ctx) {
    	let t;

    	const block = {
    		c: function create() {
    			t = text("Bundesliga");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, t, anchor);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(t);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot_3.name,
    		type: "slot",
    		source: "(51:8) <FlatButton amount=\\\"42\\\">",
    		ctx
    	});

    	return block;
    }

    // (54:8) <FlatButton amount="14">
    function create_default_slot_2(ctx) {
    	let t;

    	const block = {
    		c: function create() {
    			t = text("La Liga");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, t, anchor);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(t);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot_2.name,
    		type: "slot",
    		source: "(54:8) <FlatButton amount=\\\"14\\\">",
    		ctx
    	});

    	return block;
    }

    // (55:8) <FlatButton amount="7">
    function create_default_slot_1(ctx) {
    	let t;

    	const block = {
    		c: function create() {
    			t = text("France Ligue");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, t, anchor);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(t);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot_1.name,
    		type: "slot",
    		source: "(55:8) <FlatButton amount=\\\"7\\\">",
    		ctx
    	});

    	return block;
    }

    // (58:4) <SectionSubHeader>
    function create_default_slot$2(ctx) {
    	let homeawayheader;
    	let current;

    	homeawayheader = new HomeAwayHeader({
    			props: { title: "Bundesliga 1" },
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			create_component(homeawayheader.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(homeawayheader, target, anchor);
    			current = true;
    		},
    		p: noop,
    		i: function intro(local) {
    			if (current) return;
    			transition_in(homeawayheader.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(homeawayheader.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(homeawayheader, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot$2.name,
    		type: "slot",
    		source: "(58:4) <SectionSubHeader>",
    		ctx
    	});

    	return block;
    }

    function create_fragment$9(ctx) {
    	let header;
    	let t0;
    	let main;
    	let advert;
    	let t1;
    	let sectionheader0;
    	let t2;
    	let div0;
    	let flatbutton0;
    	let t3;
    	let flatbutton1;
    	let t4;
    	let div1;
    	let flatbutton2;
    	let t5;
    	let flatbutton3;
    	let t6;
    	let sectionheader1;
    	let t7;
    	let sectionsubheader;
    	let t8;
    	let fixturegroup0;
    	let t9;
    	let fixturegroup1;
    	let current;
    	header = new Header({ $$inline: true });
    	advert = new Advert({ $$inline: true });

    	sectionheader0 = new SectionHeader({
    			props: { name: "Popular Leagues" },
    			$$inline: true
    		});

    	flatbutton0 = new FlatButton({
    			props: {
    				amount: "34",
    				$$slots: { default: [create_default_slot_4] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	flatbutton1 = new FlatButton({
    			props: {
    				amount: "42",
    				$$slots: { default: [create_default_slot_3] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	flatbutton2 = new FlatButton({
    			props: {
    				amount: "14",
    				$$slots: { default: [create_default_slot_2] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	flatbutton3 = new FlatButton({
    			props: {
    				amount: "7",
    				$$slots: { default: [create_default_slot_1] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	sectionheader1 = new SectionHeader({
    			props: { name: "Live Now" },
    			$$inline: true
    		});

    	sectionsubheader = new SectionSubHeader({
    			props: {
    				$$slots: { default: [create_default_slot$2] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	fixturegroup0 = new FixtureGroup({ $$inline: true });
    	fixturegroup1 = new FixtureGroup({ $$inline: true });

    	const block = {
    		c: function create() {
    			create_component(header.$$.fragment);
    			t0 = space();
    			main = element("main");
    			create_component(advert.$$.fragment);
    			t1 = space();
    			create_component(sectionheader0.$$.fragment);
    			t2 = space();
    			div0 = element("div");
    			create_component(flatbutton0.$$.fragment);
    			t3 = space();
    			create_component(flatbutton1.$$.fragment);
    			t4 = space();
    			div1 = element("div");
    			create_component(flatbutton2.$$.fragment);
    			t5 = space();
    			create_component(flatbutton3.$$.fragment);
    			t6 = space();
    			create_component(sectionheader1.$$.fragment);
    			t7 = space();
    			create_component(sectionsubheader.$$.fragment);
    			t8 = space();
    			create_component(fixturegroup0.$$.fragment);
    			t9 = space();
    			create_component(fixturegroup1.$$.fragment);
    			attr_dev(div0, "class", "button-row svelte-1wmdbs7");
    			add_location(div0, file$9, 48, 4, 1241);
    			attr_dev(div1, "class", "button-row svelte-1wmdbs7");
    			add_location(div1, file$9, 52, 4, 1397);
    			attr_dev(main, "class", "svelte-1wmdbs7");
    			add_location(main, file$9, 45, 0, 1170);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			mount_component(header, target, anchor);
    			insert_dev(target, t0, anchor);
    			insert_dev(target, main, anchor);
    			mount_component(advert, main, null);
    			append_dev(main, t1);
    			mount_component(sectionheader0, main, null);
    			append_dev(main, t2);
    			append_dev(main, div0);
    			mount_component(flatbutton0, div0, null);
    			append_dev(div0, t3);
    			mount_component(flatbutton1, div0, null);
    			append_dev(main, t4);
    			append_dev(main, div1);
    			mount_component(flatbutton2, div1, null);
    			append_dev(div1, t5);
    			mount_component(flatbutton3, div1, null);
    			append_dev(main, t6);
    			mount_component(sectionheader1, main, null);
    			append_dev(main, t7);
    			mount_component(sectionsubheader, main, null);
    			append_dev(main, t8);
    			mount_component(fixturegroup0, main, null);
    			append_dev(main, t9);
    			mount_component(fixturegroup1, main, null);
    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			const flatbutton0_changes = {};

    			if (dirty & /*$$scope*/ 1) {
    				flatbutton0_changes.$$scope = { dirty, ctx };
    			}

    			flatbutton0.$set(flatbutton0_changes);
    			const flatbutton1_changes = {};

    			if (dirty & /*$$scope*/ 1) {
    				flatbutton1_changes.$$scope = { dirty, ctx };
    			}

    			flatbutton1.$set(flatbutton1_changes);
    			const flatbutton2_changes = {};

    			if (dirty & /*$$scope*/ 1) {
    				flatbutton2_changes.$$scope = { dirty, ctx };
    			}

    			flatbutton2.$set(flatbutton2_changes);
    			const flatbutton3_changes = {};

    			if (dirty & /*$$scope*/ 1) {
    				flatbutton3_changes.$$scope = { dirty, ctx };
    			}

    			flatbutton3.$set(flatbutton3_changes);
    			const sectionsubheader_changes = {};

    			if (dirty & /*$$scope*/ 1) {
    				sectionsubheader_changes.$$scope = { dirty, ctx };
    			}

    			sectionsubheader.$set(sectionsubheader_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(header.$$.fragment, local);
    			transition_in(advert.$$.fragment, local);
    			transition_in(sectionheader0.$$.fragment, local);
    			transition_in(flatbutton0.$$.fragment, local);
    			transition_in(flatbutton1.$$.fragment, local);
    			transition_in(flatbutton2.$$.fragment, local);
    			transition_in(flatbutton3.$$.fragment, local);
    			transition_in(sectionheader1.$$.fragment, local);
    			transition_in(sectionsubheader.$$.fragment, local);
    			transition_in(fixturegroup0.$$.fragment, local);
    			transition_in(fixturegroup1.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(header.$$.fragment, local);
    			transition_out(advert.$$.fragment, local);
    			transition_out(sectionheader0.$$.fragment, local);
    			transition_out(flatbutton0.$$.fragment, local);
    			transition_out(flatbutton1.$$.fragment, local);
    			transition_out(flatbutton2.$$.fragment, local);
    			transition_out(flatbutton3.$$.fragment, local);
    			transition_out(sectionheader1.$$.fragment, local);
    			transition_out(sectionsubheader.$$.fragment, local);
    			transition_out(fixturegroup0.$$.fragment, local);
    			transition_out(fixturegroup1.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(header, detaching);
    			if (detaching) detach_dev(t0);
    			if (detaching) detach_dev(main);
    			destroy_component(advert);
    			destroy_component(sectionheader0);
    			destroy_component(flatbutton0);
    			destroy_component(flatbutton1);
    			destroy_component(flatbutton2);
    			destroy_component(flatbutton3);
    			destroy_component(sectionheader1);
    			destroy_component(sectionsubheader);
    			destroy_component(fixturegroup0);
    			destroy_component(fixturegroup1);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$9.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$9($$self, $$props, $$invalidate) {
    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<App> was created with unknown prop '${key}'`);
    	});

    	let { $$slots = {}, $$scope } = $$props;
    	validate_slots("App", $$slots, []);

    	$$self.$capture_state = () => ({
    		Header,
    		SectionHeader,
    		SectionSubHeader,
    		FlatButton,
    		FixtureGroup,
    		HomeAwayHeader,
    		Advert
    	});

    	return [];
    }

    class App extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$9, create_fragment$9, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "App",
    			options,
    			id: create_fragment$9.name
    		});
    	}
    }

    const app = new App({
        target: document.body,
        props: {
            name: "world",
        },
    });

    return app;

}());
//# sourceMappingURL=bundle.js.map

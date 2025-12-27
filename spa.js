// ============== Utilities ==============
const escapeHTML = (str) => str?.replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c])) ?? '';

const Validators = {
	required: (v) => v?.trim() ? null : 'This field is required',
	pattern: (pattern, msg) => (v) => pattern.test(v) ? null : msg,
	gphc: (v) => /^\d{7}$/.test(v) ? null : 'Must be exactly 7 digits',
	ods: (v) => /^[a-zA-Z]{2,3}\d{2,3}$/i.test(v) ? null : 'Format: 2-3 letters + 2-3 digits (e.g., FA123)',
	companyNumber: (v) => /^\d{8}$/.test(v) ? null : 'Must be exactly 8 digits',
	ukPhone: (v) => /^(0|\+?44)[17]\d{8,9}$/.test(v.replace(/\s/g,'')) ? null : 'Enter a valid UK phone number',
};

// ============== Form Input Generator ==============
function bootstrap_inputs(fields, values) {
	return Object.entries(fields).map(([k, v]) => {
		const val = values instanceof Map ? values.get(k) : values?.[k] ?? '';
		const attrs = [
			`type="${v.type ?? 'text'}"`,
			`class="form-control ${v.class ?? ''}"`,
			`id="${k}" name="${k}"`,
			values !== undefined ? `value="${escapeHTML(val)}"` : '',
			`placeholder="${v.placeholder ?? ' '}"`,
			v.pattern ? `pattern="${v.pattern}"` : '',
			v.maxlength ? `maxlength="${v.maxlength}"` : '',
			v.autocomplete ? `autocomplete="${v.autocomplete}"` : '',
			v.optional ? '' : 'required',
		].filter(Boolean).join(' ');
		return `<div class="form-floating mb-3">
			<input ${attrs}>
			<label for="${k}" class="form-label">${v.label}</label>
		</div>`;
	}).join('');
}

// ============== Toast Container ==============
customElements.define('toast-container', class extends HTMLElement {
	connectedCallback() {
		this.classList.add('toast-container', 'position-fixed', 'p-3', 'z-3', 'top-0', 'end-0');
		['error', 'toast-error', 'toast-success'].forEach(evt => 
			addEventListener(evt, e => this.showToast({
				...(e.detail || { title: 'Page error', message: e.message }),
				style: evt === 'toast-success' ? 'text-bg-success' : 'text-bg-warning'
			}))
		);
	}
	showToast({ title, message, id, style = 'text-bg-info', autohide = true, dismissable = true, delay = 4000 }) {
		if (id) bootstrap.Toast.getInstance(this.querySelector(`[data-id="${id}"]`))?.hide();
		const el = document.createElement('div');
		el.className = `toast hide ${style}`;
		el.dataset.id = id;
		el.innerHTML = `
			${title || !autohide && dismissable ? `<div class="toast-header">
				${title ? `<strong class="me-auto">${title}</strong>` : ''}
				${!autohide && dismissable ? '<button type="button" class="btn-close" data-bs-dismiss="toast"></button>' : ''}
			</div>` : ''}
			${message ? `<div class="toast-body">${message}</div>` : ''}`;
		el.addEventListener('hidden.bs.toast', () => el.remove());
		this.appendChild(el);
		new bootstrap.Toast(el, { autohide, delay }).show();
	}
});

// ============== Submit Button ==============
customElements.define('submit-button', class extends HTMLElement {
	connectedCallback() {
		this.innerHTML = `
			<button type="submit" class="btn btn-primary">
				<span class="spinner-border spinner-border-sm d-none" aria-hidden="true"></span>
				${this.innerHTML}
			</button>
			<span class="alert alert-warning d-none p-3"></span>`;
		this.button = this.querySelector('button');
		this.button.form?.addEventListener('submit', () => this.busy());
	}
	busy() {
		this.button.disabled = true;
		this.button.querySelector('.spinner-border').classList.remove('d-none');
	}
	available() {
		this.button.querySelector('.spinner-border').classList.add('d-none');
		this.button.disabled = false;
	}
	message(m, type = 'alert-warning') {
		const a = this.querySelector('.alert');
		a.innerHTML = m;
		a.className = `alert ${type} p-3`;
	}
});

// ============== Reusable List Editor Mixin ==============
const ListEditorMixin = (Base) => class extends Base {
	static get config() { return { itemTag: 'div', addLabel: 'Add', icon: 'plus-lg' }; }
	
	connectedCallback() {
		super.connectedCallback?.();
		this.addEventListener('click', this);
		this.render();
	}
	
	render() {
		const { addLabel, icon } = this.constructor.config;
		this.innerHTML = `
			<div data-list class="mb-2"></div>
			<div class="input-group">
				${this.inputsHTML()}
				<button type="button" class="btn btn-outline-primary" data-action="add">
					<i class="bi bi-${icon} me-1"></i>${addLabel}
				</button>
			</div>`;
	}
	
	inputsHTML() { return ''; }
	getInputValues() { return {}; }
	validateInputs() { return null; }
	createItemHTML(values) { return ''; }
	
	handleEvent(e) {
		const action = e.target.closest('[data-action]')?.dataset.action;
		if (action === 'remove') {
			e.target.closest('[data-item]')?.remove();
			this.dispatchEvent(new CustomEvent('change', { bubbles: true }));
		} else if (action === 'add') {
			this.addItem();
		}
	}
	
	addItem() {
		const error = this.validateInputs();
		if (error) return;
		const values = this.getInputValues();
		this.querySelector('[data-list]').insertAdjacentHTML('beforeend', this.createItemHTML(values));
		this.clearInputs();
		this.focusFirstInput();
		this.dispatchEvent(new CustomEvent('change', { bubbles: true }));
	}
	
	clearInputs() {
		this.querySelectorAll('[data-input]').forEach(el => { el.value = ''; el.setCustomValidity(''); });
	}
	
	focusFirstInput() {
		this.querySelector('[data-input]')?.focus();
	}
	
	getItems() {
		return [...this.querySelectorAll('[data-item]')].map(el => 
			Object.fromEntries([...el.querySelectorAll('[data-field]')].map(f => [f.dataset.field, f.value]))
		);
	}
	
	setItems(items) {
		this.querySelector('[data-list]').innerHTML = items.map(v => this.createItemHTML(v)).join('');
	}
	
	clear() {
		this.querySelector('[data-list]').innerHTML = '';
	}
	
	get count() {
		return this.querySelectorAll('[data-item]').length;
	}
};

// ============== List Group Mixin ==============
const ListGroupMixin = (Base) => class extends Base {
	connectedCallback() {
		super.connectedCallback?.();
		this.classList.add('list-group');
		this.addEventListener('addItem', e => this.addItem(e.detail));
		this.addEventListener('setItems', e => this.setItems(e.detail));
		this.addEventListener('clearItems', () => this.clear());
	}
	itemHTML(item) { return `<div class="list-group-item">${item}</div>`; }
	addItem(item) { this.innerHTML += this.itemHTML(item); }
	setItems(items) { this.innerHTML = items.map(i => this.itemHTML(i)).join(''); }
	clear() { this.replaceChildren(); }
};

customElements.define('list-group', class extends ListGroupMixin(HTMLElement) {});

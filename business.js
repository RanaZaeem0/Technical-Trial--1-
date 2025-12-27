// ============== Field Configurations ==============
const FIELDS = {
	contact: {
		name: { label: 'Name', autocomplete: 'name' },
		position: { label: 'Position', autocomplete: 'organization-title' },
		email: { label: 'Email', type: 'email', autocomplete: 'email' },
		invoiceEmail: { label: 'Invoice Email (Optional)', type: 'email', optional: true, autocomplete: 'email' },
		telephone: { label: 'Telephone', type: 'tel', pattern: '^(0|\\+?44)[17]\\d{8,9}$', autocomplete: 'tel' },
	},
	business: {
		limitedCompany: {
			name: 'Limited Company',
			fields: {
				name: { label: 'Company Name', autocomplete: 'organization' },
				number: { label: 'Company Number', placeholder: '01234567', pattern: '^\\d{8}$', maxlength: 8 },
				address: { label: 'Address', autocomplete: 'street-address' },
			}
		},
		soleTrader: {
			name: 'Sole Trader',
			fields: {
				name: { label: 'Business Name', autocomplete: 'organization' },
				address: { label: 'Address', autocomplete: 'street-address' },
			}
		},
		partnership: {
			name: 'Partnership',
			fields: {
				name: { label: 'Partnership Name', autocomplete: 'organization' },
				address: { label: 'Address', autocomplete: 'street-address' },
				partners: { label: 'Partner Names' },
			}
		}
	}
};

// ============== Pharmacy List Editor ==============
customElements.define('pharmacy-list-editor', class extends ListEditorMixin(HTMLElement) {
	static get config() { return { addLabel: 'Add Pharmacy', icon: 'shop' }; }
	
	inputsHTML() {
		return `<input data-input="ods" class="form-control" placeholder="ODS code (e.g., FA123)" maxlength="6">`;
	}
	
	getInputValues() {
		return { ods: this.querySelector('[data-input="ods"]').value.trim().toUpperCase() };
	}
	
	validateInputs() {
		const input = this.querySelector('[data-input="ods"]');
		const error = Validators.ods(input.value.trim());
		input.setCustomValidity(error || '');
		if (error) { input.reportValidity(); input.focus(); }
		return error;
	}
	
	createItemHTML({ ods }) {
		return `<div data-item class="input-group mb-2">
			<span class="input-group-text"><i class="bi bi-shop"></i></span>
			<input data-field="ods" class="form-control" name="ods" value="${escapeHTML(ods)}" readonly>
			<button type="button" class="btn btn-outline-danger" data-action="remove"><i class="bi bi-trash"></i></button>
		</div>`;
	}
});

// ============== Pharmacist List Editor ==============
customElements.define('pharmacist-list-editor', class extends ListEditorMixin(HTMLElement) {
	static get config() { return { addLabel: 'Add Pharmacist', icon: 'person-badge' }; }
	
	inputsHTML() {
		return `
			<input data-input="gphc" class="form-control" placeholder="GPhC (7 digits)" maxlength="7" style="max-width:140px">
			<input data-input="name" class="form-control" placeholder="Full Name">`;
	}
	
	getInputValues() {
		return {
			gphc: this.querySelector('[data-input="gphc"]').value.trim(),
			name: this.querySelector('[data-input="name"]').value.trim(),
		};
	}
	
	validateInputs() {
		const gphcInput = this.querySelector('[data-input="gphc"]');
		const nameInput = this.querySelector('[data-input="name"]');
		
		const gphcError = Validators.gphc(gphcInput.value.trim());
		if (gphcError) {
			gphcInput.setCustomValidity(gphcError);
			gphcInput.reportValidity();
			gphcInput.focus();
			return gphcError;
		}
		gphcInput.setCustomValidity('');
		
		if (!nameInput.value.trim()) {
			nameInput.focus();
			return 'Name is required';
		}
		return null;
	}
	
	createItemHTML({ gphc, name }) {
		return `<div data-item class="input-group mb-2">
			<span class="input-group-text"><i class="bi bi-person-badge"></i></span>
			<input data-field="gphc" class="form-control" name="gphc" value="${escapeHTML(gphc)}" readonly style="max-width:120px">
			<input data-field="name" class="form-control" name="pharmacistName" value="${escapeHTML(name)}" readonly>
			<button type="button" class="btn btn-outline-danger" data-action="remove"><i class="bi bi-trash"></i></button>
		</div>`;
	}
});

// ============== Business Application Form ==============
customElements.define('business-application', class extends HTMLElement {
	connectedCallback() {
		this.addEventListener('submit', this);
		this.addEventListener('change', this);
		this.render();
	}
	
	handleEvent(e) {
		if (e.type === 'change' && e.target.name === 'businessType') {
			this.renderBusinessFields(e.target.value);
		}
		if (e.type === 'submit') {
			e.preventDefault();
			this.submit(e.target);
		}
	}
	
	render(values = {}) {
		this.innerHTML = `
		<form novalidate>
			<section class="mb-4">
				<h5 class="mb-3">Business Type</h5>
				<div class="btn-group w-100" role="group">
					${Object.entries(FIELDS.business).map(([k, v]) => `
						<input type="radio" class="btn-check" name="businessType" id="${k}" value="${k}" ${values.businessType === k ? 'checked' : ''} required>
						<label class="btn btn-outline-primary btn-lg flex-fill" for="${k}">${v.name}</label>
					`).join('')}
				</div>
			</section>
			
			<fieldset id="businessFields" class="mb-4"></fieldset>
			
			<fieldset class="mb-4">
				<legend><i class="bi bi-person-circle me-2"></i>Contact Details</legend>
				${bootstrap_inputs(FIELDS.contact, values.contact)}
			</fieldset>
			
			<fieldset class="mb-4">
				<legend><i class="bi bi-shop me-2"></i>Pharmacies</legend>
				<p class="text-muted small mb-2">Add at least one pharmacy using its ODS code</p>
				<pharmacy-list-editor></pharmacy-list-editor>
			</fieldset>
			
			<fieldset class="mb-4">
				<legend><i class="bi bi-person-badge me-2"></i>Pharmacists</legend>
				<p class="text-muted small mb-2">Add at least one pharmacist with their GPhC number</p>
				<pharmacist-list-editor></pharmacist-list-editor>
			</fieldset>
			
			<div class="d-grid mt-4">
				<button type="submit" class="btn btn-primary btn-lg">
					<i class="bi bi-send me-2"></i>Submit Application
				</button>
			</div>
		</form>`;
		
		if (values.businessType) this.renderBusinessFields(values.businessType, values.business);
		if (values.pharmacies) this.querySelector('pharmacy-list-editor').setItems(values.pharmacies);
		if (values.pharmacists) this.querySelector('pharmacist-list-editor').setItems(values.pharmacists);
	}
	
	renderBusinessFields(type, values) {
		const config = FIELDS.business[type];
		if (!config) return;
		this.querySelector('#businessFields').innerHTML = `
			<legend>${config.name} Details</legend>
			${bootstrap_inputs(config.fields, values)}`;
	}
	
	validate() {
		const form = this.querySelector('form');
		const data = new FormData(form);
		
		if (!data.get('businessType')) 
			return { selector: '[name=businessType]', message: 'Please select a business type' };
		if (!this.querySelector('pharmacy-list-editor').count) 
			return { selector: 'pharmacy-list-editor [data-input]', message: 'Please add at least one pharmacy' };
		if (!this.querySelector('pharmacist-list-editor').count) 
			return { selector: 'pharmacist-list-editor [data-input]', message: 'Please add at least one pharmacist' };
		
		return null;
	}
	
	submit(form) {
		const error = this.validate();
		if (error) {
			this.querySelector(error.selector)?.focus();
			dispatchEvent(new CustomEvent('toast-error', { detail: { message: error.message } }));
			return;
		}
		
		const data = new FormData(form);
		const id = this.getAttribute('k');
		if (id) data.set('id', id);
		
		this.dispatchEvent(new CustomEvent('journal-post', {
			bubbles: true,
			detail: { type: id ? 'business-accept' : 'business-application', data }
		}));
	}
	
	result({ reply, error, target }) {
		if (!reply?.length || error) {
			dispatchEvent(new CustomEvent('toast-error', { detail: { message: 'An error occurred. Please try again.', style: 'text-bg-danger' } }));
			return;
		}
		this.innerHTML = `
			<div class="alert alert-success text-center p-5" role="alert">
				<i class="bi bi-check-circle-fill fs-1 d-block mb-3"></i>
				<h4>Application Submitted!</h4>
				<p class="mb-0">Our team will contact you with the next steps.</p>
			</div>`;
		dispatchEvent(new CustomEvent('toast-success', { detail: { message: 'Application sent successfully' } }));
		target?.remove();
	}
});

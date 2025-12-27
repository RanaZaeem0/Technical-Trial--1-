// ============== Field Configs ==============
const FIELDS = {
  contact: {
    name: { label: "Full Name", autocomplete: "name", icon: "person" },
    position: { label: "Position / Role", icon: "briefcase" },
    email: { label: "Email Address", type: "email", icon: "envelope" },
    telephone: {
      label: "Phone Number (UK) ",
      type: "tel",
      pattern: "^(0|\\+?44)[17]\\d{8,9}$",
      icon: "telephone",
    },
    invoiceEmail: {
      label: "Invoice Email (optional)",
      type: "email",
      optional: true,
      icon: "receipt",
    },
  },
  business: {
    limitedCompany: {
      name: "Limited Company",
      icon: "building",
      description: "Registered company with Companies House",
      fields: {
        companyName: { label: "Registered Company Name", icon: "building" },
        companyNumber: {
          label: "Company Number",
          pattern: "^\\d{8}$",
          maxlength: 8,
          placeholder: "8-digit number",
          icon: "hash",
        },
        registeredAddress: {
          label: "Registered Office Address",
          icon: "geo-alt",
        },
        tradingAddress: {
          label: "Trading Address (if different)",
          optional: true,
          icon: "shop",
        },
      },
    },
    soleTrader: {
      name: "Sole Trader",
      icon: "person",
      description: "Self-employed individual",
      fields: {
        tradingName: { label: "Trading Name", icon: "tag" },
        businessAddress: { label: "Business Address", icon: "geo-alt" },
        utrNumber: {
          label: "UTR Number (optional)",
          optional: true,
          pattern: "^\\d{10}$",
          maxlength: 10,
          placeholder: "10-digit number",
          icon: "file-earmark-text",
        },
      },
    },
    partnership: {
      name: "Partnership",
      icon: "people",
      description: "Two or more people in business together",
      fields: {
        partnershipName: { label: "Partnership Name", icon: "people" },
        businessAddress: { label: "Business Address", icon: "geo-alt" },
        partnerNames: {
          label: "Partner Names",
          placeholder: "Comma-separated names",
          icon: "person-lines-fill",
        },
        utrNumber: {
          label: "Partnership UTR (optional)",
          optional: true,
          pattern: "^\\d{10}$",
          maxlength: 10,
          icon: "file-earmark-text",
        },
      },
    },
  },
};

// ============== Pharmacy Editor ==============
customElements.define(
  "pharmacy-editor",
  class extends ListEditor {
    static config = {
      label: "Add",
      icon: "plus-lg",
      emptyText: "Add pharmacies using their ODS code",
      emptyIcon: "shop",
    };

    inputsHTML() {
      return `<input data-input="ods" class="form-control" placeholder="ODS code (e.g., FA123)" maxlength="6">`;
    }

    values() {
      return {
        ods: this.querySelector("[data-input]").value.trim().toUpperCase(),
      };
    }

    validate() {
      const input = this.querySelector("[data-input]");
      const error = Validators.ods(input.value.trim());
      if (error) {
        input.setCustomValidity(error);
        input.reportValidity();
      }
      return error;
    }

    itemHTML({ ods }) {
      return `<div data-item class="input-group mb-2">
			<span class="input-group-text"><i class="bi bi-shop"></i></span>
			<input class="form-control" name="ods" value="${html(ods)}" readonly>
			<button type="button" class="btn btn-outline-danger" data-remove><i class="bi bi-x-lg"></i></button>
		</div>`;
    }
  }
);

// ============== Pharmacist Editor ==============
customElements.define(
  "pharmacist-editor",
  class extends ListEditor {
    static config = {
      label: "Add",
      icon: "plus-lg",
      emptyText: "Add pharmacists with their GPhC number",
      emptyIcon: "person-badge",
    };

    inputsHTML() {
      return `
			<input data-input="gphc" class="form-control" placeholder="GPhC number" maxlength="7" style="max-width:130px">
			<input data-input="name" class="form-control" placeholder="Full name">`;
    }

    values() {
      return {
        gphc: this.querySelector('[data-input="gphc"]').value.trim(),
        name: this.querySelector('[data-input="name"]').value.trim(),
      };
    }

    validate() {
      const gphc = this.querySelector('[data-input="gphc"]');
      const name = this.querySelector('[data-input="name"]');

      const err = Validators.digits(7)(gphc.value.trim());
      if (err) {
        gphc.setCustomValidity(err);
        gphc.reportValidity();
        return err;
      }
      gphc.setCustomValidity("");

      if (!name.value.trim()) {
        name.focus();
        return "Name required";
      }
      return null;
    }

    itemHTML({ gphc, name }) {
      return `<div data-item class="input-group mb-2">
			<span class="input-group-text"><i class="bi bi-person-badge"></i></span>
			<input class="form-control" name="gphc" value="${html(
        gphc
      )}" readonly style="max-width:110px">
			<input class="form-control" name="pharmacistName" value="${html(
        name
      )}" readonly>
			<button type="button" class="btn btn-outline-danger" data-remove><i class="bi bi-x-lg"></i></button>
		</div>`;
    }
  }
);

// ============== Business Application ==============
customElements.define(
  "business-application",
  class extends HTMLElement {
    currentStep = 1;
    totalSteps = 3;
    selectedBusinessType = null;

    connectedCallback() {
      this.render();
      this.setupListeners();
    }

    setupListeners() {
      this.addEventListener("click", (e) => {
        if (e.target.closest("[data-next]")) this.nextStep();
        if (e.target.closest("[data-prev]")) this.prevStep();
        if (e.target.closest("[data-submit]")) this.submit();
      });

      this.addEventListener("change", (e) => {
        if (e.target.name === "businessType") {
          this.selectedBusinessType = e.target.value;
        }
      });
    }

    render() {
      const steps = [
        { icon: "person-circle", label: "Contact" },
        { icon: "briefcase", label: "Business" },
        { icon: "clipboard-check", label: "Details" },
      ];

      this.innerHTML = `
        <div class="wizard">
          <!-- Progress Bar -->
          <div class="wizard-progress mb-4">
            ${steps
              .map(
                (s, i) => `
              <div class="wizard-step ${
                i + 1 < this.currentStep ? "completed" : ""
              } ${i + 1 === this.currentStep ? "active" : ""}">
                <div class="wizard-step-icon">
                  ${
                    i + 1 < this.currentStep
                      ? '<i class="bi bi-check-lg"></i>'
                      : `<i class="bi bi-${s.icon}"></i>`
                  }
                </div>
                <span class="wizard-step-label">${s.label}</span>
              </div>
              ${
                i < steps.length - 1
                  ? '<div class="wizard-step-line"></div>'
                  : ""
              }
            `
              )
              .join("")}
          </div>

          <form novalidate>
            ${this.renderStep()}
          </form>
        </div>`;
    }

    renderStep() {
      switch (this.currentStep) {
        case 1:
          return this.renderContactStep();
        case 2:
          return this.renderBusinessTypeStep();
        case 3:
          return this.renderDetailsStep();
      }
    }

    renderContactStep() {
      return `
        <fieldset class="card-section step-content">
          <legend><i class="bi bi-person-circle me-2"></i>Contact Details</legend>
          <p class="text-muted small mb-3">We'll use these details to communicate about your application</p>
          ${formInputs(FIELDS.contact)}
        </fieldset>
        <div class="wizard-nav">
          <div></div>
          <button type="button" class="btn btn-primary" data-next>
            Next <i class="bi bi-arrow-right ms-2"></i>
          </button>
        </div>`;
    }

    renderBusinessTypeStep() {
      return `
        <section class="card-section step-content">
          <h5><i class="bi bi-briefcase me-2"></i>Select Business Type</h5>
          <p class="text-muted small mb-3">Choose the type of business entity you're registering</p>
          <div class="business-type-grid">
            ${Object.entries(FIELDS.business)
              .map(
                ([k, b]) => `
              <div class="business-type-option">
                <input type="radio" class="btn-check" name="businessType" id="${k}" value="${k}" 
                  ${this.selectedBusinessType === k ? "checked" : ""} required>
                <label class="business-type-card" for="${k}">
                  <i class="bi bi-${b.icon} business-type-icon"></i>
                  <span class="business-type-name">${b.name}</span>
                  <span class="business-type-desc">${b.description}</span>
                </label>
              </div>
            `
              )
              .join("")}
          </div>
        </section>
        <div class="wizard-nav">
          <button type="button" class="btn btn-outline-primary" data-prev>
            <i class="bi bi-arrow-left me-2"></i> Back
          </button>
          <button type="button" class="btn btn-primary" data-next>
            Next <i class="bi bi-arrow-right ms-2"></i>
          </button>
        </div>`;
    }

    renderDetailsStep() {
      const bType = FIELDS.business[this.selectedBusinessType];
      return `
        ${
          bType
            ? `
          <fieldset class="card-section step-content">
            <legend><i class="bi bi-${bType.icon} me-2"></i>${
                bType.name
              } Details</legend>
            <p class="text-muted small mb-3">Provide your ${bType.name.toLowerCase()} information</p>
            ${formInputs(bType.fields)}
          </fieldset>
        `
            : ""
        }
        
        <fieldset class="card-section step-content">
          <legend><i class="bi bi-shop me-2"></i>Pharmacies</legend>
          <p class="text-muted small mb-3">Add the pharmacy locations for this application</p>
          <pharmacy-editor></pharmacy-editor>
        </fieldset>
        
        <fieldset class="card-section step-content">
          <legend><i class="bi bi-person-badge me-2"></i>Pharmacists</legend>
          <p class="text-muted small mb-3">Add pharmacists who will be associated with this business</p>
          <pharmacist-editor></pharmacist-editor>
        </fieldset>
        
        <div class="wizard-nav">
          <button type="button" class="btn btn-outline-primary" data-prev>
            <i class="bi bi-arrow-left me-2"></i> Back
          </button>
          <button type="button" class="btn btn-primary btn-lg" data-submit>
            <i class="bi bi-send-fill me-2"></i> Submit Application
          </button>
        </div>`;
    }

    validateCurrentStep() {
      const form = this.querySelector("form");
      const inputs = form.querySelectorAll(
        ".step-content input:not([readonly]), .step-content select"
      );

      for (const input of inputs) {
        if (!input.checkValidity()) {
          input.reportValidity();
          return false;
        }
      }

      if (this.currentStep === 2 && !this.selectedBusinessType) {
        toast("Please select a business type");
        return false;
      }

      return true;
    }

    saveFormData() {
      // Store current form data before re-rendering
      const form = this.querySelector("form");
      if (!form) return;

      this._formData = this._formData || {};
      const data = new FormData(form);
      for (const [key, value] of data.entries()) {
        this._formData[key] = value;
      }
    }

    restoreFormData() {
      if (!this._formData) return;

      setTimeout(() => {
        const form = this.querySelector("form");
        if (!form) return;

        for (const [key, value] of Object.entries(this._formData)) {
          const input = form.querySelector(`[name="${key}"]`);
          if (input && input.type !== "radio") {
            input.value = value;
          }
        }
      }, 0);
    }

    nextStep() {
      if (!this.validateCurrentStep()) return;
      this.saveFormData();

      if (this.currentStep < this.totalSteps) {
        this.currentStep++;
        this.render();
        this.restoreFormData();
        this.scrollToTop();
      }
    }

    prevStep() {
      this.saveFormData();

      if (this.currentStep > 1) {
        this.currentStep--;
        this.render();
        this.restoreFormData();
        this.scrollToTop();
      }
    }

    scrollToTop() {
      this.scrollIntoView({ behavior: "smooth", block: "start" });
    }

    submit() {
      if (!this.validateCurrentStep()) return;

      const pharmacyCount = this.querySelector("pharmacy-editor")?.count || 0;
      const pharmacistCount =
        this.querySelector("pharmacist-editor")?.count || 0;

      if (!pharmacyCount) return toast("Add at least one pharmacy");
      if (!pharmacistCount) return toast("Add at least one pharmacist");

      this.saveFormData();

      const form = this.querySelector("form");
      const data = new FormData(form);

      // Add saved form data
      for (const [key, value] of Object.entries(this._formData || {})) {
        if (!data.has(key)) {
          data.set(key, value);
        }
      }

      const id = this.getAttribute("k");
      if (id) data.set("id", id);

      this.dispatchEvent(
        new CustomEvent("journal-post", {
          bubbles: true,
          detail: {
            type: id ? "business-accept" : "business-application",
            data,
          },
        })
      );
    }

    result({ reply, error }) {
      if (!reply?.length || error) return toast("An error occurred");
      this.innerHTML = `
        <div class="success-card text-center">
          <div class="success-icon">
            <i class="bi bi-check-lg"></i>
          </div>
          <h3 class="fw-bold mb-3">Application Submitted!</h3>
          <p class="text-muted mb-4">Thank you for your application. Our team will review it and contact you within 2-3 business days.</p>
          <a href="#" class="btn btn-outline-primary" onclick="location.reload()">
            <i class="bi bi-plus-circle me-2"></i>Submit Another Application
          </a>
        </div>`;
      toast("Sent!", "success");
    }
  }
);

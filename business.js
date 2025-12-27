// ============== Field Configs ==============
const FIELDS = {
  contact: {
    name: { label: "Name", autocomplete: "name" },
    position: { label: "Position" },
    email: { label: "Email", type: "email" },
    invoiceEmail: { label: "Invoice Email", type: "email", optional: true },
    telephone: {
      label: "Telephone",
      type: "tel",
      pattern: "^(0|\\+?44)[17]\\d{8,9}$",
    },
  },
  business: {
    limitedCompany: {
      name: "Limited Company",
      fields: {
        name: { label: "Company Name" },
        number: { label: "Company Number", pattern: "^\\d{8}$", maxlength: 8 },
        address: { label: "Address" },
      },
    },
    soleTrader: {
      name: "Sole Trader",
      fields: {
        name: { label: "Business Name" },
        address: { label: "Address" },
      },
    },
    partnership: {
      name: "Partnership",
      fields: {
        name: { label: "Partnership Name" },
        address: { label: "Address" },
        partners: { label: "Partner Names" },
      },
    },
  },
};

// ============== Pharmacy Editor ==============
customElements.define(
  "pharmacy-editor",
  class extends ListEditor {
    static config = { label: "Add Pharmacy", icon: "shop" };

    inputsHTML() {
      return `<input data-input="ods" class="form-control" placeholder="ODS code" maxlength="6">`;
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
			<button type="button" class="btn btn-outline-danger" data-remove><i class="bi bi-trash"></i></button>
		</div>`;
    }
  }
);

// ============== Pharmacist Editor ==============
customElements.define(
  "pharmacist-editor",
  class extends ListEditor {
    static config = { label: "Add Pharmacist", icon: "person-badge" };

    inputsHTML() {
      return `
			<input data-input="gphc" class="form-control" placeholder="GPhC (7 digits)" maxlength="7" style="max-width:130px">
			<input data-input="name" class="form-control" placeholder="Full Name">`;
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
			<button type="button" class="btn btn-outline-danger" data-remove><i class="bi bi-trash"></i></button>
		</div>`;
    }
  }
);

// ============== Business Application ==============
customElements.define(
  "business-application",
  class extends HTMLElement {
    connectedCallback() {
      this.addEventListener("submit", (e) => {
        e.preventDefault();
        this.submit();
      });
      this.addEventListener("change", (e) => {
        if (e.target.name === "businessType")
          this.showBusinessFields(e.target.value);
      });
      this.render();
    }

    render(v = {}) {
      this.innerHTML = `
		<form novalidate>
			<section class="mb-4">
				<h5>Business Type</h5>
				<div class="btn-group w-100" role="group">
					${Object.entries(FIELDS.business)
            .map(
              ([k, b]) => `
						<input type="radio" class="btn-check" name="businessType" id="${k}" value="${k}" required>
						<label class="btn btn-outline-primary btn-lg flex-fill" for="${k}">${b.name}</label>
					`
            )
            .join("")}
				</div>
			</section>
			
			<fieldset id="businessFields" class="mb-4"></fieldset>
			
			<fieldset class="mb-4">
				<legend><i class="bi bi-person-circle me-2"></i>Contact</legend>
				${formInputs(FIELDS.contact, v.contact)}
			</fieldset>
			
			<fieldset class="mb-4">
				<legend><i class="bi bi-shop me-2"></i>Pharmacies</legend>
				<pharmacy-editor></pharmacy-editor>
			</fieldset>
			
			<fieldset class="mb-4">
				<legend><i class="bi bi-person-badge me-2"></i>Pharmacists</legend>
				<pharmacist-editor></pharmacist-editor>
			</fieldset>
			
			<button type="submit" class="btn btn-primary btn-lg w-100">
				<i class="bi bi-send me-2"></i>Submit
			</button>
		</form>`;
    }

    showBusinessFields(type) {
      const c = FIELDS.business[type];
      if (c)
        this.querySelector("#businessFields").innerHTML = `<legend>${
          c.name
        }</legend>${formInputs(c.fields)}`;
    }

    submit() {
      const form = this.querySelector("form");
      const data = new FormData(form);

      // Validation
      if (!data.get("businessType")) return toast("Select a business type");
      if (!this.querySelector("pharmacy-editor").count)
        return toast("Add at least one pharmacy");
      if (!this.querySelector("pharmacist-editor").count)
        return toast("Add at least one pharmacist");

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
			<div class="alert alert-success text-center p-5">
				<i class="bi bi-check-circle-fill fs-1 d-block mb-3"></i>
				<h4>Application Submitted!</h4>
				<p class="mb-0">We'll contact you soon.</p>
			</div>`;
      toast("Sent!", "success");
    }
  }
);

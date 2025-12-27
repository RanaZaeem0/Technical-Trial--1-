// ============== Core Utilities ==============

const html = (str) =>
  str?.replace(
    /[&<>"']/g,
    (c) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[
        c
      ])
  ) ?? "";

const Validators = {
  required: (v) => (v?.trim() ? null : "Required"),
  digits: (n) => (v) =>
    new RegExp(`^\\d{${n}}$`).test(v) ? null : `Must be ${n} digits`,
  ods: (v) => (/^[a-zA-Z]{2,3}\d{2,3}$/i.test(v) ? null : "Format: FA123"),
};

function formInputs(fields, values) {
  return Object.entries(fields)
    .map(([k, v]) => {
      const val = values?.[k] ?? "";
      const hasIcon = v.icon;
      const inputHTML = `<input type="${
        v.type ?? "text"
      }" class="form-control" id="${k}" name="${k}"
				value="${html(val)}" placeholder="${v.placeholder ?? v.label}"
				${v.pattern ? `pattern="${v.pattern}"` : ""} 
				${v.maxlength ? `maxlength="${v.maxlength}"` : ""}
				${v.autocomplete ? `autocomplete="${v.autocomplete}"` : ""}
				${v.optional ? "" : "required"}>`;

      if (hasIcon) {
        return `<div class="input-group mb-3">
          <span class="input-group-text"><i class="bi bi-${v.icon}"></i></span>
          <div class="form-floating flex-grow-1">
            ${inputHTML}
            <label for="${k}">${v.label}</label>
          </div>
        </div>`;
      }

      return `<div class="form-floating mb-3">
        ${inputHTML}
        <label for="${k}">${v.label}</label>
      </div>`;
    })
    .join("");
}

function toast(message, type = "error") {
  dispatchEvent(new CustomEvent(`toast-${type}`, { detail: { message } }));
}

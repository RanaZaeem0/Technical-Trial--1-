// ============== Toast Container ==============
customElements.define(
  "toast-container",
  class extends HTMLElement {
    connectedCallback() {
      this.classList.add(
        "toast-container",
        "position-fixed",
        "p-3",
        "z-3",
        "top-0",
        "end-0"
      );
      addEventListener("toast-error", (e) =>
        this.show(e.detail.message, "danger")
      );
      addEventListener("toast-success", (e) =>
        this.show(e.detail.message, "success")
      );
    }
    show(message, type = "info", delay = 4000) {
      const el = document.createElement("div");
      el.className = `toast hide text-bg-${type}`;
      el.innerHTML = `
        <div class="toast-body d-flex align-items-center gap-2">
          <i class="bi bi-${
            type === "success" ? "check-circle" : "exclamation-circle"
          }-fill"></i>
          ${message}
        </div>`;
      el.addEventListener("hidden.bs.toast", () => el.remove());
      this.appendChild(el);
      new bootstrap.Toast(el, { delay }).show();
    }
  }
);

// ============== List Editor Base ==============
class ListEditor extends HTMLElement {
  static config = {
    label: "Add",
    icon: "plus-lg",
    emptyText: "No items added yet",
    emptyIcon: "inbox",
  };

  connectedCallback() {
    this.addEventListener("click", this);
    this.render();
  }

  render() {
    const { label, icon, emptyText, emptyIcon } = this.constructor.config;
    this.innerHTML = `
      <div data-list></div>
      <div data-empty class="empty-hint">
        <i class="bi bi-${emptyIcon}"></i>
        <small>${emptyText}</small>
      </div>
      <div class="input-group">
        ${this.inputsHTML()}
        <button type="button" class="btn btn-outline-primary" data-add>
          <i class="bi bi-${icon} me-1"></i>${label}
        </button>
      </div>`;
  }

  handleEvent(e) {
    if (e.target.closest("[data-remove]")) {
      e.target.closest("[data-item]")?.remove();
      this.updateEmpty();
    } else if (e.target.closest("[data-add]")) {
      this.add();
    }
  }

  add() {
    const error = this.validate();
    if (error) return;
    this.querySelector("[data-list]").insertAdjacentHTML(
      "beforeend",
      this.itemHTML(this.values())
    );
    this.clear();
    this.updateEmpty();
  }

  updateEmpty() {
    const empty = this.querySelector("[data-empty]");
    if (empty) empty.style.display = this.count ? "none" : "block";
  }

  clear() {
    this.querySelectorAll("[data-input]").forEach((el) => {
      el.value = "";
      el.setCustomValidity("");
    });
    this.querySelector("[data-input]")?.focus();
  }

  get count() {
    return this.querySelectorAll("[data-item]").length;
  }

  setItems(items) {
    this.querySelector("[data-list]").innerHTML = items
      .map((v) => this.itemHTML(v))
      .join("");
    this.updateEmpty();
  }

  // Override in subclasses
  inputsHTML() {
    return "";
  }
  itemHTML(v) {
    return "";
  }
  values() {
    return {};
  }
  validate() {
    return null;
  }
}

/* ═══════════════════════════════════════════════
   ThemedSelect — Custom combobox + popover
   Native <option> styling is unreliable across
   Chrome/Safari/Firefox; this widget gives a fully
   themed, keyboard-accessible, filterable dropdown.
   ═══════════════════════════════════════════════ */

let _instanceCount = 0;

export class ThemedSelect {
    /**
     * @param {Object} opts
     * @param {HTMLElement} opts.mountEl    Mount container (replaces native <select> if it's one)
     * @param {Array<{value, label, sublabel?, disabled?}>} opts.items
     * @param {string} [opts.value]         Initial value
     * @param {string} [opts.placeholder]   Trigger placeholder when no value
     * @param {boolean} [opts.filterable]   Show filter input in popover
     * @param {Function} [opts.onChange]    (value, item) => void
     */
    constructor(opts) {
        this.opts = opts;
        this.items = opts.items || [];
        this.value = opts.value ?? null;
        this.placeholder = opts.placeholder || '— Seç —';
        this.filterable = !!opts.filterable;
        this.onChange = opts.onChange || (() => {});
        this.id = `ts-${++_instanceCount}`;
        this.open = false;
        this.highlightedIdx = -1;
        this.filterText = '';

        this._build(opts.mountEl);
        this._bindEvents();
        this._render();
    }

    _build(mountEl) {
        // Eğer mount bir <select> ise, onu sil ve yerine div koy
        let host = mountEl;
        if (mountEl.tagName === 'SELECT') {
            const replacement = document.createElement('div');
            replacement.id = mountEl.id;            // ID'yi koru
            replacement.className = mountEl.className;
            mountEl.parentNode.replaceChild(replacement, mountEl);
            host = replacement;
        }

        host.innerHTML = '';
        host.classList.add('ts-root');
        host.setAttribute('role', 'combobox');
        host.setAttribute('aria-haspopup', 'listbox');
        host.setAttribute('aria-expanded', 'false');
        host.tabIndex = 0;

        host.innerHTML = `
            <button class="ts-trigger" type="button" aria-controls="${this.id}-list">
                <span class="ts-label">${this.placeholder}</span>
                <svg class="ts-chevron" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                    <polyline points="6 9 12 15 18 9"></polyline>
                </svg>
            </button>
            <div class="ts-popover" hidden>
                ${this.filterable ? `<input class="ts-filter" type="text" placeholder="Filtrele…" autocomplete="off">` : ''}
                <ul class="ts-options" id="${this.id}-list" role="listbox"></ul>
            </div>
        `;

        this.host = host;
        this.trigger = host.querySelector('.ts-trigger');
        this.labelEl = host.querySelector('.ts-label');
        this.popover = host.querySelector('.ts-popover');
        this.filterInput = host.querySelector('.ts-filter');
        this.optionsList = host.querySelector('.ts-options');
    }

    _bindEvents() {
        this.trigger.addEventListener('click', (e) => {
            e.stopPropagation();
            this.toggle();
        });

        this.host.addEventListener('keydown', (e) => this._onKeyDown(e));

        if (this.filterInput) {
            this.filterInput.addEventListener('input', () => {
                this.filterText = this.filterInput.value.toLowerCase();
                this.highlightedIdx = -1;
                this._renderOptions();
            });
            this.filterInput.addEventListener('keydown', (e) => {
                this._onKeyDown(e);
                e.stopPropagation();   // ts-root handler'ına çift sayım yapılmasın
            });
        }

        // Dış tıklamada kapat
        document.addEventListener('click', (e) => {
            if (this.open && !this.host.contains(e.target)) this.close();
        });
    }

    _onKeyDown(e) {
        if (!this.open) {
            if (['Enter', ' ', 'ArrowDown', 'ArrowUp'].includes(e.key)) {
                e.preventDefault();
                this.openPopover();
            }
            return;
        }
        const visible = this._visibleItems();
        if (e.key === 'Escape') {
            e.preventDefault();
            this.close();
            this.trigger.focus();
        } else if (e.key === 'ArrowDown') {
            e.preventDefault();
            this.highlightedIdx = Math.min(this.highlightedIdx + 1, visible.length - 1);
            this._renderOptions();
        } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            this.highlightedIdx = Math.max(this.highlightedIdx - 1, 0);
            this._renderOptions();
        } else if (e.key === 'Enter') {
            e.preventDefault();
            const item = visible[this.highlightedIdx];
            if (item) this.commit(item.value);
        } else if (e.key === 'Home') {
            e.preventDefault();
            this.highlightedIdx = 0;
            this._renderOptions();
        } else if (e.key === 'End') {
            e.preventDefault();
            this.highlightedIdx = visible.length - 1;
            this._renderOptions();
        }
    }

    _visibleItems() {
        if (!this.filterText) return this.items;
        return this.items.filter(it =>
            it.label.toLowerCase().includes(this.filterText) ||
            (it.sublabel && it.sublabel.toLowerCase().includes(this.filterText))
        );
    }

    _render() {
        const item = this.items.find(it => String(it.value) === String(this.value));
        this.labelEl.textContent = item ? item.label : this.placeholder;
        this.labelEl.classList.toggle('ts-placeholder', !item);
        this._renderOptions();
    }

    _renderOptions() {
        const visible = this._visibleItems();
        this.optionsList.innerHTML = '';
        if (visible.length === 0) {
            const li = document.createElement('li');
            li.className = 'ts-empty';
            li.textContent = 'Eşleşen bulunamadı.';
            this.optionsList.appendChild(li);
            return;
        }
        visible.forEach((it, i) => {
            const li = document.createElement('li');
            li.className = 'ts-option';
            li.setAttribute('role', 'option');
            li.dataset.value = it.value;
            if (it.disabled) li.classList.add('disabled');
            if (String(it.value) === String(this.value)) li.classList.add('selected');
            if (i === this.highlightedIdx) li.classList.add('highlighted');
            li.innerHTML = it.sublabel
                ? `<span class="ts-opt-label">${it.label}</span><span class="ts-opt-sub">${it.sublabel}</span>`
                : `<span class="ts-opt-label">${it.label}</span>`;
            li.addEventListener('mouseenter', () => {
                this.highlightedIdx = i;
                this._renderOptions();
            });
            li.addEventListener('click', (e) => {
                e.stopPropagation();
                if (!it.disabled) this.commit(it.value);
            });
            this.optionsList.appendChild(li);
        });

        // Vurgulanan'a kaydır
        if (this.highlightedIdx >= 0) {
            const el = this.optionsList.children[this.highlightedIdx];
            if (el && el.scrollIntoView) el.scrollIntoView({ block: 'nearest' });
        }
    }

    toggle() {
        this.open ? this.close() : this.openPopover();
    }

    openPopover() {
        if (this.open) return;
        this.open = true;
        this.popover.hidden = false;
        this.host.setAttribute('aria-expanded', 'true');
        this.host.classList.add('open');
        if (this.filterInput) {
            this.filterInput.value = '';
            this.filterText = '';
            setTimeout(() => this.filterInput.focus(), 0);
        }
        this.highlightedIdx = this.items.findIndex(it => String(it.value) === String(this.value));
        this._renderOptions();
    }

    close() {
        if (!this.open) return;
        this.open = false;
        this.popover.hidden = true;
        this.host.setAttribute('aria-expanded', 'false');
        this.host.classList.remove('open');
    }

    commit(value) {
        this.value = value;
        this._render();
        this.close();
        const item = this.items.find(it => String(it.value) === String(value));
        this.onChange(value, item);
        this.trigger.focus();
    }

    setValue(value, fireChange = false) {
        this.value = value;
        this._render();
        if (fireChange) {
            const item = this.items.find(it => String(it.value) === String(value));
            this.onChange(value, item);
        }
    }

    setItems(items) {
        this.items = items;
        this._render();
    }
}

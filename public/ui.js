class ExpandableList extends HTMLElement {
    connectedCallback() {
        const label = this.getAttribute('label');
        this.shadow = this.attachShadow({mode: 'open'});
        this.isExpanded = this.getAttribute('expanded');
        this.shadow.innerHTML = `
            <style>
                .label {
                    cursor: pointer;
                    user-select: none;
                }
                .list {
                    height: 0;
                    overflow: hidden;
                    padding: 0 0 0 10px;
                    margin: 0;
                }
                .arrow {
                    display: inline-block;
                    width: 6px;
                    height: 6px;
                    box-sizing: boder-box;
                    transition: transform 100ms linear;
                    transform: rotate(45deg);
                    border-color: #dadada;
                    border-width: 1px 1px 0 0;
                    border-style: solid;
                }
                .root.open .arrow {
                    transform: rotate(135deg);
                }
                .root.open .list {
                    height: auto;
                }
            </style>
            <div class="root" data-root>
                <div class="label" data-label>
                    <span class="arrow"></span>
                    <span>${label}</span>
                </div>
                <ul class="list">
                    <slot></slot>
                </ul>
            </div>
        `
        this.root = this.select('root');
        this.bind('label', 'click', this.toggle);
        this.update();
    }
    select(name) {
        return this.shadow.querySelector(`[data-${name}]`);
    }
    bind(name, event, cb) {
        this.select(name).addEventListener(event, cb)
    }
    toggle = () => {
        this.isExpanded = !this.isExpanded;
        this.update();
        console.log('toggle');
    }
    update = () => {
        if (this.isExpanded) {
            this.root.classList.add('open');
            this.setAttribute('expanded', 'expanded');
        } else {
            this.root.classList.remove('open');
            this.removeAttribute('expanded');
        }
    }
}
customElements.define('x-list', ExpandableList);

class Toggle extends HTMLElement {
    connectedCallback() {
        this.shadow = this.attachShadow({mode: 'open'});
        this.shadow.innerHTML = `
            <style>
                .root {
                    display: flex;
                    padding: 4px 0;
                    align-items: center;
                    cursor: pointer;
                    user-select: none;
                }
                .track {
                    width: 28px;
                    height: 14px;
                    border-radius: 9px;
                    background: #dadada;
                    padding: 1px;
                    box-sizing: border-box;
                    transition: background 100ms ease-in;
                }
                .check {
                    width: 12px;
                    height: 12px;
                    border-radius: 8px;
                    background: white;
                    transition: margin-left 100ms ease-in;
                }
                .label {
                    margin-left: 4px;
                }
                .root.checked .track {
                    background: #91d345;
                }
                .root.checked .check {
                    margin-left: 14px;
                }
            </style>
            <div class="root" data-root>
                <div class="track">
                    <div class="check"></div>
                </div>
                <span class="label"><slot></slot></span>
            </div>
        `
        this.root = this.shadow.querySelector('[data-root]');
        this.root.addEventListener('click', this.toggle);
        this.isChecked = this.getAttribute('checked');
        this.update();
    }
    update() {
        if (this.isChecked) {
            this.setAttribute('checked', 'checked');
            this.root.classList.add('checked');
        } else {
            this.removeAttribute('checked');
            this.root.classList.remove('checked');
        }
    }
    toggle = () => {
        this.isChecked = !this.isChecked;
        this.update();
    }
}
customElements.define('x-toggle', Toggle);

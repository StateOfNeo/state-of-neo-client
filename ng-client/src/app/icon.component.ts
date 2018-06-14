import { Directive, ElementRef, OnInit, Input } from '@angular/core';

declare var $;

@Directive({
  selector: 'son-icon'
})
export class IconComponent implements OnInit {
    @Input() name: string;

    constructor(private el: ElementRef) {
        
    }

    ngOnInit() {
        var properties = {
            prefix: '#tsvg-',
            class: 'icon-button__tsvg tsvg',
            role: 'img'
        };

        var svg = document.createElement('svg');
        var use = document.createElement('use');

        svg.setAttribute('role', properties.role);
        svg.setAttribute('class', properties.class);
        // svg.setAttribute('name', this.name);

        use.setAttribute('xmlns:xlink', 'http://www.w3.org/1999/xlink');
        use.setAttribute('xlink:href', properties.prefix + this.name.toLowerCase());

        svg.appendChild(use);

        $(this.el.nativeElement).replaceWith(svg.outerHTML);
    }
}
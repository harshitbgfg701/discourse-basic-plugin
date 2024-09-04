import Component from "@ember/component";
import { tracked } from '@glimmer/tracking';
import { action } from '@ember/object';
import { ajax } from "discourse/lib/ajax";
import { slugify } from "../utlis/helper";

export default class CustomTabsComponent extends Component {
    @tracked defaultTags = [
        { name: 'PS5', fade: '' },
        { name: 'Xbox Series X', fade: '' },
        { name: 'PS3', fade: '' },
        { name: 'Xbox 360', fade: '' },
        { name: 'Wii', fade: '' },
        { name: 'PC', fade: '' },
        { name: 'PSP', fade: '' },
        { name: 'PS Vita', fade: '' },
        { name: 'Next-Gen', fade: '' },
        { name: 'PS4', fade: '' },
        { name: 'Xbox One', fade: '' },
        { name: 'Wii U', fade: '' },
        { name: 'Nintendo Switch', fade: '' },
        { name: 'DS', fade: '' },
        { name: '3DS', fade: '' },
        { name: 'iPhone', fade: '' },
        { name: 'iPad', fade: '' },
        { name: 'Android', fade: '' },
    ];

    @tracked selectedTags = [];
    @tracked searchedTags = [];
    timeout = null;
    @tracked createTagValue = null;
    
    tabs = [
        {
            name: 'tag-suggestions',
            label: 'Tag Suggestions',
            active: false,
            id: 'defaultOpen'
        },
        {
            name: 'tab-2',
            label: 'Tab 2',
            active: false
        },
        // {
        //     name: 'tab-3',
        //     label: 'Tab 3',
        //     active: false
        // }
    ];

    didInsertElement() {
        super.didInsertElement();
        this.selectedTags = this.initialTags;

        this.defaultTags = this.defaultTags.map(tag => {
        if (this.selectedTags.includes(slugify(tag.name))) {
                return {...tag, fade: 'in-active'}
            }
            return tag;
        })

        document.getElementById("defaultOpen").click();
    }

    @action
    onTabsChange(name, event) {
        let i, tabContent, tabLinks;

        tabContent = document.getElementsByClassName('tabcontent');
        for (i = 0; i < tabContent.length; i++) {
            tabContent[i].style.display = "none";
        }

        tabLinks = document.getElementsByClassName("tablinks");
        for (i = 0; i < tabLinks.length; i++) {
            tabLinks[i].className = tabLinks[i].className.replace(" active", "");
        }

        document.getElementById(name).style.display = "block";
        event.currentTarget.className += " active";
    }
    
    @action
    handleTagClick(selectedTag) {        
        this.defaultTags = this.defaultTags.map(tag => {
            if (tag.name === selectedTag.name) {
                return { ...tag, fade: 'in-active', disabled: false };
            }

            return tag;
        });

        if (typeof selectedTag === 'string') {
            if (!this.selectedTags.includes(slugify(selectedTag))) {
                this.selectedTags = [...this.selectedTags, slugify(selectedTag)];
                this.createTagValue = null;

                document.getElementsByClassName('search-tag')[0].value = '';
            }
        } else {
            if (!this.selectedTags.includes(slugify(selectedTag.name))) {
                this.selectedTags = [...this.selectedTags, slugify(selectedTag.name)];
            }
        }

        document.getElementById('selected-tags-input').value = this.selectedTags.join(',');
    }

    @action
    toggleSelectedTag(tag) {
        this.defaultTags = this.defaultTags.map((item) => {
            if(tag === slugify(item.name)) {
                return { ...item, fade: '', disabled: false };
            }

            return item;
        })

        this.selectedTags = this.selectedTags.filter(selectedTag => selectedTag !== tag);

        document.getElementById('selected-tags-input').value = this.selectedTags.join(',');
    }

    @action
    handleInputChange(value) {
        clearTimeout(this.timeout);

        this.timeout = setTimeout(async () => {
            try {
                this.createTagValue = value;
                this.searchedTags = (await ajax(`/tags/filter/search?q=${value}`)).results;
            } catch (error) {
                console.error('Error while searching for tag', error);
            }
        }, 500);
    }
}
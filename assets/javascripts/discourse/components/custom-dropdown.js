import Component from "@ember/component";
import { inject as service } from '@ember/service';
import { ajax } from "discourse/lib/ajax";

export default Component.extend({
  currentUser: service(),
  router: service(),

  init() {
    this._super(...arguments);
    if (this.currentUser) {
        this.set('customField', this.currentUser.custom_thumbnail_style_dropdown);
    }
  },

  actions: {
    saveSelection(value) {
        let userId = this.currentUser.id;
        let url = `/custom-field/update_custom_field/${userId}`;

        let csrfToken = document.querySelector('meta[name="csrf-token"]').getAttribute('content');

        if (!csrfToken) {
            console.error("CSRF token not found");
            return;
        }

        let data = {
            custom_thumbnail_style_dropdown: value
        };

        ajax(url, {
            method: 'POST',
            dataType: 'json',
            contentType: 'application/json',
            data: JSON.stringify(data),
            headers: {
                'X-CSRF-Token': csrfToken
            }
        }).then(() => {
            if (value) {
                this.set('currentUser.custom_thumbnail_style_dropdown', value);
            }
            this.router.refresh();
        })
        .catch(error => {
            console.error('Error:', error);
        });
    },
  },
});

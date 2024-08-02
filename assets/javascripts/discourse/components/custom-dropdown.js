import Component from "@ember/component";
import { inject as service } from '@ember/service';
import { ajax } from "discourse/lib/ajax";

export default Component.extend({
  currentUser: service(),

  actions: {
    saveSelection(value) {
        let userId = this.currentUser.id;
        let url = `/custom-field/update_custom_field/${userId}`;

        // Access the CSRF token
        let csrfToken = document.querySelector('meta[name="csrf-token"]').getAttribute('content');

        if (!csrfToken) {
            console.error("CSRF token not found");
            return;
        }

        // Construct the payload to update the custom field
        let data = {
            custom_thumbnail_style_dropdown: value
        };

        // Make an AJAX request to update the user custom field
        ajax(url, {
            method: 'POST',
            dataType: 'json',
            contentType: 'application/json',
            data: JSON.stringify(data),
            headers: {
                'X-CSRF-Token': csrfToken
            }
        })
        .catch(error => {
            console.error('Error:', error);
        });
    }
  }
});

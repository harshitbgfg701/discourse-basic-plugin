import Component from "@ember/component";
import { inject as service } from '@ember/service';
import CustomModel from "./modal/custom-model";

export default Component.extend({
    currentUser: service(),
    composer: service(),
    modal: service(),

    init() {
        this._super(...arguments);
    },

    actions: {
        handleSubmitTopic() {
            this.modal.show(CustomModel);
        },
    },
})
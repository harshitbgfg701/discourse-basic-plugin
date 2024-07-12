import { withPluginApi } from 'discourse/lib/plugin-api';
import discourseComputed from "discourse-common/utils/decorators";
import { alias } from '@ember/object/computed';
import { isDefined, fieldInputTypes } from '../lib/topic-custom-field';
import I18n from 'I18n';

export default {
    name: 'topic-custom-field-intializer',
    initialize(container) {

        const siteSettings = container.lookup('site-settings:main');
        const fieldName = siteSettings.topic_custom_field_name;
        const fieldType = siteSettings.topic_custom_field_type;

        if (!siteSettings.bgfg_topic_custom_field_enabled) {
            return;
        }

        console.log('Field Name', fieldName);
        console.log('Field Type', fieldType);

        withPluginApi('0.8', api => {

            api.registerConnectorClass('composer-fields', 'composer-topic-custom-field-container', {
                setupComponent(attrs, component) {
                    const model = attrs.model;

                    // If the first post is being edited we need to pass our value from
                    // the topic model to the composer model.
                    if (!isDefined(model[fieldName]) && model.topic && model.topic[fieldName]) {
                        model.set(fieldName, model.topic[fieldName]);
                    }

                    let props = {
                        fieldName: fieldName,
                        fieldValue: model.get(fieldName),
                        placeholder: I18n.t('topic_custom_field.placeholder', { field: fieldName })
                    }
                    component.setProperties(Object.assign(props, fieldInputTypes(fieldType)));
                },

                actions: {
                    onChangeField(fieldValue) {
                        this.set(`model.${fieldName}`, fieldValue);
                    }
                }
            });


        });
    }
};
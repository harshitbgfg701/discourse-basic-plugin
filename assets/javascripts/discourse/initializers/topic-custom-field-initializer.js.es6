import { withPluginApi } from 'discourse/lib/plugin-api';
import discourseComputed from "discourse-common/utils/decorators";
import { alias } from '@ember/object/computed';
import { isDefined, fieldInputTypes } from '../lib/topic-custom-field';

export default {
    name: 'topic-custom-field-intializer',
    initialize(container) {

        const siteSettings = container.lookup('site-settings:main');
        let fieldName = siteSettings.topic_custom_field_name;
        const labelFieldName = fieldName;
        const fieldType = siteSettings.topic_custom_field_type;

        fieldName = fieldName.trim().replace(/\s+/g, '_').toLowerCase();

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
                        fieldName: labelFieldName,
                        fieldValue: model.get(fieldName)
                    }
                    component.setProperties(Object.assign(props, fieldInputTypes(fieldType)));
                },

                actions: {
                    onChangeField(fieldValue) {
                        console.log('composer-fields', fieldValue);
                        this.set(`model.${fieldName}`, fieldValue);
                    }
                }
            });

            api.registerConnectorClass('edit-topic', 'edit-topic-custom-field-container', {
                setupComponent(attrs, component) {
                    const model = attrs.model;

                    let props = {
                        fieldName: fieldName,
                        fieldValue: model.get(fieldName)
                    }
                    component.setProperties(Object.assign(props, fieldInputTypes(fieldType)));
                },

                actions: {
                    onChangeField(fieldValue) {
                        console.log('edit-topic', fieldValue);
                        this.set(`buffered.${fieldName}`, fieldValue);
                    }
                }
            });

            api.serializeOnCreate(fieldName);
            api.serializeToDraft(fieldName);
            api.serializeToTopic(fieldName, `topic.${fieldName}`);


        });
    }
};
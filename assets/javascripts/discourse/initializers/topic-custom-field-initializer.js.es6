import { withPluginApi } from 'discourse/lib/plugin-api';
import { alias } from '@ember/object/computed';
import { isDefined, fieldInputTypes } from '../lib/topic-custom-field';
import Ember from 'ember';

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

                    console.log('composer-fields - model', model);

                    // If the first post is being edited we need to pass our value from
                    // the topic model to the composer model.
                    if (!isDefined(model[fieldName]) && model.topic && model.topic[fieldName]) {
                        model.set(fieldName, model.topic[fieldName]);
                    }

                    let props = {
                        fieldName: labelFieldName,
                        fieldValue: model.get(fieldName)
                    }
                    console.log('composer-fields - set up component', props);
                    component.setProperties(Object.assign(props, fieldInputTypes(fieldType)));
                },

                actions: {
                    onChangeField(event) {
                        const fieldValue = event.target.value;
                        console.log(`model.${fieldName}`, fieldValue);
                        this.set(`model.${fieldName}`, fieldValue);
                    },
                    onSaveTopic() {
                        const model = this.get('model');
                        const fieldValue = model.get(fieldName); // Get the current value
                        console.log('composer-fields - Saving custom description:', fieldValue);
                        model.set(fieldName, fieldValue);
                    }
                }
            });

            api.registerConnectorClass('edit-topic', 'edit-topic-custom-field-container', {
                setupComponent(attrs, component) {
                    const model = attrs.model;
                    
                    console.log('edit-topic - model', model);

                    let props = {
                        fieldName: fieldName,
                        fieldValue: model.get(fieldName)
                    }
                    console.log('edit-topic - set up component', props);
                    component.setProperties(Object.assign(props, fieldInputTypes(fieldType)));
                },

                actions: {
                    onChangeField(fieldValue) {
                        console.log('edit-topic - onChangeField', fieldValue);
                        this.set(`buffered.${fieldName}`, fieldValue);
                    },
                    onSaveTopic() {
                        const model = this.get('buffered');
                        const fieldValue = model.get(fieldName); // Get the current value of custom_description
                        console.log('edit-topic - Saving custom description:', fieldValue);
                        model.set(fieldName, fieldValue);
                    }
                }
            });

            api.serializeOnCreate(fieldName);
            api.serializeToDraft(fieldName);
            api.serializeToTopic(fieldName, `topic.${fieldName}`);


            api.registerConnectorClass('topic-title', 'topic-title-custom-field-container', {
                setupComponent(attrs, component) {
                const model = attrs.model;
                const controller = container.lookup('controller:topic');
                
                component.setProperties({
                    fieldName: fieldName,
                    fieldValue: model.get(fieldName),
                    showField: !controller.get('editingTopic') && isDefined(model.get(fieldName))
                });

                controller.addObserver('editingTopic', () => {
                    if (this._state === 'destroying') return;
                    component.set('showField', !controller.get('editingTopic') && isDefined(model.get(fieldName)));
                });
                
                model.addObserver(fieldName, () => {
                    if (this._state === 'destroying') return;
                    component.set('fieldValue', model.get(fieldName));
                });
                }
            });


            api.modifyClass('component:topic-list-item', {
                customFieldName: fieldName,
                customFieldValue: alias(`topic.${fieldName}`),

                showCustomField: Ember.computed('customFieldValue', function() {
                    const value = this.get('customFieldValue');
                    return isDefined(value);
                })
            });

        });
    }
};

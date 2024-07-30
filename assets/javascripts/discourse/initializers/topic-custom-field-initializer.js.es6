import { withPluginApi } from 'discourse/lib/plugin-api';
import { alias } from '@ember/object/computed';
import { isDefined, fieldInputTypes } from '../lib/topic-custom-field';
import Ember from 'ember';

async function getFileChecksum(file) {
    const arrayBuffer = await file.arrayBuffer();
    const hashBuffer = await crypto.subtle.digest('SHA-1', arrayBuffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    return hashHex;
}

async function uploadImage(file, callback) {
    const formData = new FormData();
    const checksum = await getFileChecksum(file);

    formData.append('upload_type', 'composer');
    formData.append('pasted', 'undefined'); // If this field can be omitted or set to 'false', adjust as necessary
    formData.append('name', file.name);
    formData.append('type', file.type);
    formData.append('sha1_checksum', checksum);
    formData.append('file', file);

    fetch(`/uploads.json`, {
        method: 'POST',
        headers: {
            'Api-Key': '4b743a435e37463ab4e42bacf2f4ae561f56a4a149d0a9715ecdaf6d1c4718d6',
            'Api-Username': 'system',
            'Accept': 'application/json'
        },
        body: formData,
    })
        .then(response => response.text())
        .then(text => {
            try {
                const data = JSON.parse(text);
                if (data && data.url) {
                    callback(data.url);
                } else {
                    console.error('Image upload failed:', data);
                }
            } catch (error) {
                console.error('Error parsing JSON:', error);
            }
        })
        .catch(error => {
            console.error('Error uploading image:', error);
        });
}

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

        withPluginApi('0.8.26', api => {
            api.registerConnectorClass('composer-fields', 'composer-topic-custom-field-container', {
                setupComponent(attrs, component) {
                    const model = attrs.model;

                    if (model.action === 'createTopic' || (model.action === 'edit' && model.editingFirstPost)) {
                        // If the first post is being edited we need to pass our value from
                        // the topic model to the composer model.
                        if (!isDefined(model[fieldName]) && model.topic && model.topic[fieldName]) {
                            model.set(fieldName, model.topic[fieldName]);
                        }

                        if (model.topic && model.topic['topic_file_upload']) {
                            model.set('topic_file_upload', model.topic['topic_file_upload']);
                        }

                        let props = {
                            fieldName: labelFieldName,
                            fieldValue: model.get(fieldName),
                            topic_file_upload: model.topic && model.topic['topic_file_upload'] ? model.topic['topic_file_upload'] : null
                        }
                        component.setProperties(Object.assign(props, fieldInputTypes(fieldType)));
                    }
                },

                actions: {
                    onChangeField(event) {
                        const model = this.get('model');
                        const fieldValue = event.target.value;
                        model.set(fieldName, fieldValue);
                    },
                    uploadAndAttachImage(event) {
                        const fileInput = event.target.closest('.controls').querySelector('#fileUpload');
                        const file = fileInput.files[0];
                        if (file) {
                            uploadImage(file, (url) => {
                                this.get('model').set('composerText', `${this.get('model').get('composerText')} ![image](${url}) `);
                                this.get('model').set('topic_file_upload', url);
                            });
                        }
                    }
                }
            });

            api.serializeOnCreate(fieldName);
            api.serializeToDraft(fieldName);
            api.serializeToTopic(fieldName, `topic.${fieldName}`);

            api.serializeOnCreate('topic_file_upload');
            api.serializeToTopic('topic_file_upload', `topic.topic_file_upload`);

            api.modifyClass('component:composer-editor', {

                didInsertElement() {
                    this._super(...arguments);

                    const toolbar = this.toolbar;
                    if (!toolbar) {
                        return;
                    }

                    toolbar.addButton({
                        id: 'upload-image',
                        icon: 'upload',
                        action: 'uploadAndAttachImage',
                        title: 'Upload Image',
                        label: 'Upload Image',
                    });
                }
            });


            // api.registerConnectorClass('topic-title', 'topic-title-custom-field-container', {
            //     setupComponent(attrs, component) {
            //     const model = attrs.model;
            //     const controller = container.lookup('controller:topic');

            //     component.setProperties({
            //         fieldName: fieldName,
            //         fieldValue: model.get(fieldName),
            //         showField: !controller.get('editingTopic') && isDefined(model.get(fieldName))
            //     });

            //     controller.addObserver('editingTopic', () => {
            //         if (this._state === 'destroying') return;
            //         component.set('showField', !controller.get('editingTopic') && isDefined(model.get(fieldName)));
            //     });

            //     model.addObserver(fieldName, () => {
            //         if (this._state === 'destroying') return;
            //         component.set('fieldValue', model.get(fieldName));
            //     });
            //     }
            // });

            // api.modifyClass('component:topic-list-item', {
            //     customFieldName: fieldName,
            //     customFieldValue: alias(`topic.${fieldName}`),

            //     showCustomField: Ember.computed('customFieldValue', function() {
            //         const value = this.get('customFieldValue');
            //         return isDefined(value);
            //     })
            // });
        });
    }
};
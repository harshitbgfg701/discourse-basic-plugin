import { withPluginApi } from 'discourse/lib/plugin-api';
import { isDefined, fieldInputTypes } from '../lib/topic-custom-field';

async function uploadImage(file) {
    const formData = new FormData();
    try {
        formData.append('upload_type', 'composer');
        formData.append('file', file);

        const response = await fetch('/uploads.json', {
            method: 'POST',
            headers: {
                'Api-Key': '4b743a435e37463ab4e42bacf2f4ae561f56a4a149d0a9715ecdaf6d1c4718d6',
                'Api-Username': 'system',
                'Accept': 'application/json'
            },
            body: formData
        });

        if (!response.ok) {
            throw new Error(`Upload failed with status ${response.status}`);
        }

        const data = await response.json();
        if (data && data.url) {
            return data.url;
        } else {
            throw new Error('Image upload failed');
        }
    } catch (error) {
        throw error;
    }
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
                    async onChangeFileUpload() {
                        $(".save-or-cancel .create").prop('disabled', true);
                        const fileInput = document.getElementById('fileUpload');
                        const file = fileInput.files[0];

                        if (file) {
                            try {
                                const uploadedFileURL = await uploadImage(file);

                                if (uploadedFileURL) {
                                    this.get('model').set('topic_file_upload', uploadedFileURL);
                                }
                            } catch (error) {
                                console.log('error', error);
                            } finally {
                                $(".save-or-cancel .create").prop('disabled', false);
                            }
                        }
                    }
                }
            });

            api.serializeOnCreate(fieldName);
            api.serializeToDraft(fieldName);
            api.serializeToTopic(fieldName, `topic.${fieldName}`);

            api.serializeOnCreate('topic_file_upload');
            api.serializeToDraft('topic_file_upload');
            api.serializeToTopic('topic_file_upload', `topic.topic_file_upload`);

            api.modifyClass('service:composer', {
                pluginId: "discourse-custom-topic-field",

                async save() {
                    const model = this.get('model');

                    if (model.action === 'createTopic' || model.action === 'edit') {
                        const fieldValue = document.getElementById('topic-custom-field-input').value;

                        if (fieldValue) {
                            model.set(fieldName, fieldValue);
                        }
                        this._super(...arguments);
                    } else {
                        this._super(...arguments);
                    }
                }
            });
        });
    }
};
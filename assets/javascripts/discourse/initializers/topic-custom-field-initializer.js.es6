import { withPluginApi } from 'discourse/lib/plugin-api';
import { isDefined, fieldInputTypes } from '../lib/topic-custom-field';
import { uploadImage } from '../utlis/uploadImage';

export default {
    name: 'topic-custom-field-intializer',
    initialize(container) {
        const siteSettings = container.lookup('site-settings:main');
        const composer = container.lookup("service:composer");
        let fieldName = siteSettings.topic_custom_field_name;
        const labelFieldName = fieldName;
        const fieldType = siteSettings.topic_custom_field_type;

        fieldName = fieldName.trim().replace(/\s+/g, '_').toLowerCase();

        if (!siteSettings.bgfg_topic_custom_field_enabled) {
            return;
        }

        withPluginApi('0.8.26', api => {
            api.registerConnectorClass('composer-fields', 'composer-topic-custom-field-container', {
                async setupComponent(attrs, component) {
                    const model = attrs.model;

                    if (model.action==="createTopic" && model.draftKey==="draft" && model.title) {
                        await composer.store.find("similar-topic", { title: model.title });
                        this.appEvents.trigger("composer:find-similar");
                    }

                    if (model.action === 'createTopic' || (model.action === 'edit' && model.editingFirstPost)) {
                        // If the first post is being edited we need to pass our value from
                        // the topic model to the composer model.
                        if (!isDefined(model[fieldName]) && model.topic && model.topic[fieldName]) {
                            model.set(fieldName, model.topic[fieldName]);
                        }

                        if (model.topic && model.topic['topic_file_upload']) {
                            model.set('topic_file_upload', model.topic['topic_file_upload']);
                        }

                        if (model.topic && model.topic['topic_video_input']) {
                            model.set('topic_video_input', model.topic['topic_video_input']);
                        }

                        if (model.topic && model.topic['topic_credit_input']) {
                            model.set('topic_credit_input', model.topic['topic_credit_input']);
                        }

                        let props = {
                            fieldName: labelFieldName,
                            fieldValue: model.get(fieldName),
                            topic_file_upload: model.topic && model.topic['topic_file_upload'] ? model.topic['topic_file_upload'] : null,
                            topic_video_input: model.topic && model.topic['topic_video_input'] ? model.topic['topic_video_input'] : null,
                            topic_credit_input: model.topic && model.topic['topic_credit_input'] ? model.topic['topic_credit_input'] : null
                        }

                        if (model.action === 'createTopic' && (model.topic_file_upload || model.topic_video_input || model.topic_credit_input)) {
                            props = {
                                ...props,
                                topic_file_upload: model.topic_file_upload || '',
                                topic_video_input: model.topic_video_input || '',
                                topic_credit_input: model.topic_credit_input || ''
                            }
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
                                const uploadedFileData = await uploadImage(file);

                                if (uploadedFileData && uploadedFileData.url) {
                                    this.get('model').set('topic_file_upload', uploadedFileData.url);
                                    this.get('model').set('topic_file_upload_id', uploadedFileData.id);
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

            api.serializeOnCreate('topic_file_upload_id');
            api.serializeToDraft('topic_file_upload_id');
            api.serializeToTopic('topic_file_upload_id', `topic.topic_file_upload_id`);

            api.serializeOnCreate('topic_video_input');
            api.serializeToDraft('topic_video_input');
            api.serializeToTopic('topic_video_input', `topic.topic_video_input`);


            api.serializeOnCreate('topic_credit_input');
            api.serializeToDraft('topic_credit_input');
            api.serializeToTopic('topic_credit_input', `topic.topic_credit_input`);

            api.modifyClass('service:composer', {
                pluginId: "discourse-custom-topic-field",

                async save() {
                    const model = this.get('model');

                    if (model.action === 'createTopic' || model.action === 'edit') {
                        const customFieldValue = document.getElementById('topic-custom-field-input').value;
                        const topicVideoValue = document.getElementById('topic-video-input').value;
                        const topicCreditUrlValue = document.getElementById('topic-credit-input').value;

                        if (customFieldValue) {
                            model.set(fieldName, customFieldValue);
                        }
                        if (topicVideoValue) {
                            model.set('topic_video_input', topicVideoValue);
                        }
                        if (topicCreditUrlValue) {
                            model.set('topic_credit_input', topicCreditUrlValue);
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
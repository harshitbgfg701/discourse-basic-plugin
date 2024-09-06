import Component from "@ember/component";
import { inject as service } from '@ember/service';
import Composer from "discourse/models/composer";
import { uploadImage } from "../../utlis/uploadImage";
import { computed } from '@ember/object';
import { tracked } from '@glimmer/tracking';

export default Component.extend({
    url: tracked(),
    submitError: tracked(),
    isLoading: tracked(),
    disableBtn: computed('url', 'submitError', 'isLoading', function() {
        return !this.url || this.url && this.submitError || this.isLoading
    }),
    modal: service(),
    composer: service(),
    actions: {
        async submit() {
            try {
                const targetUrl = this.get('url').trim();
                this.isLoading = true;

                if (targetUrl && await validateUrl(targetUrl)) {
                        let ogData;
                        const response = await fetch(`https://corsproxy.io/?https://scrape.n4g.com/fetchMetadata?url=${targetUrl}`); // Todo: Remove Proxy
                        
                        if (!response.ok) {
                            throw new Error('Error while fetching data');
                        }
                        ogData = (await response.json())?.data;

                        if (ogData) {
                            let imageData;
                            if(ogData.image && ogData.decodedImage) {
                                let imageName = ogData.image.match(/.*\/(.*)$/)[1];
                                if (imageName.includes('?')) {
                                    imageName = imageName.split('?')[0];
                                }
                                try {
                                    imageData = await createFile(ogData.decodedImage, imageName);
                                } catch (error) {
                                    throw new Error('Something went wrong! Please try again later');
                                }
                            }

                            let options = {
                                title: ogData.title ? ogData.title : '',
                                topicBody: ogData.description ? ogData.description : '',
                                read_full_story: ogData.url,
                                topic_video_input: ogData['video:url'] ? ogData['video:url'] : ''
                            }

                            if (ogData.image && ogData.decodedImage && imageData) {
                                try {
                                    const uploadedImage = await uploadImage(imageData);
                                    options['topic_file_upload'] = uploadedImage.url ? uploadedImage.url : '';
                                    options['topic_file_upload_id'] = uploadedImage.id ? uploadedImage.id : null;
                                } catch (error) {
                                    throw new Error('Something went wrong! Please try again later');
                                }
                            }

                            this.modal.close();
                            this.composer.open({
                                action: Composer.CREATE_TOPIC,
                                draftKey: Composer.DRAFT,
                                ...options
                            });
                        } else {
                            this.modal.close();
                        }
                } else {
                    throw new Error('Invalid submit url');
                }
            } catch (error) {
                this.set('submitError', error.message);
            } finally {
                this.isLoading = false;
            }
        },

        handleOnChange(value) {
            if (value) {
                this.url = value.trim();
            } else {
                this.url = value;
                this.set('submitError', 'Invalid submit url');
            }
        },

        async handleOnBlur(url) {
            if (url && await validateUrl(url)) {
                this.set('submitError', null);
            } else {
                this.set('submitError', 'Invalid submit url');
            }
        }
    },
});

async function validateUrl(url) {
    var expression = /(https?:\/\/(?:www\.|(?!www))[a-zA-Z0-9][a-zA-Z0-9-]+[a-zA-Z0-9]\.[^\s]{2,}|www\.[a-zA-Z0-9][a-zA-Z0-9-]+[a-zA-Z0-9]\.[^\s]{2,}|https?:\/\/(?:www\.|(?!www))[a-zA-Z0-9]+\.[^\s]{2,}|www\.[a-zA-Z0-9]+\.[^\s]{2,})/gi;
    var regex = new RegExp(expression);

    if (url && url.match(regex)) {
        return true;
    } else {
        return false;
    }
}

async function createFile(fileURI, imageName) {
    let arr = fileURI.split(','),
        mime = arr[0].match(/:(.*?);/)[1],
        bstr = atob(arr[arr.length - 1]), 
        n = bstr.length, 
        u8arr = new Uint8Array(n);
    while(n--){
        u8arr[n] = bstr.charCodeAt(n);
    }
    return new File([u8arr], imageName, {type:mime});
}

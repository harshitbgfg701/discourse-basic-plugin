import Component from "@ember/component";
import { inject as service } from '@ember/service';
import Composer from "discourse/models/composer";
import { uploadImage } from "../../utlis/uploadImage";
import { computed } from '@ember/object';
import { tracked } from '@glimmer/tracking';

export default Component.extend({
    url: tracked(),
    submitError: tracked(),
    disableBtn: computed('url', 'submitError', function() {
        return !this.url || this.submitError
    }),
    modal: service(),
    composer: service(),
    actions: {
        async submit() {
            const targetUrl = this.get('url');
            const proxyUrl = 'https://corsproxy.io/?';

            if (targetUrl && await validateUrl(targetUrl)) {
                let ogData;
                try {
                    const response = await fetch(proxyUrl + targetUrl);
                    const html = await response.text();
                    ogData = await parseHtml(html);
                } catch (error) {
                    this.set('submitError', 'Something went wrong while fetching data!');
                    return false;
                }

                if (ogData) {
                    let imageData;
                    if (!ogData.url) {
                        ogData.url = this.get('url');
                    }
                    if(ogData.url && ogData.image) {
                        let imageName = ogData.image.match(/.*\/(.*)$/)[1];
                        if (imageName.includes('?')) {
                            imageName = imageName.split('?')[0];
                        }
                        try {
                            imageData = await createFile(proxyUrl + ogData.image, imageName);
                        } catch (error) {
                            console.error('Error while downloading file');
                            this.set('submitError', 'Something went wrong! Please try again later');
                            return false;
                        }
                    }

                    let options = {
                        title: ogData.title ? ogData.title : '',
                        topicBody: ogData.description ? ogData.description : '',
                        read_full_story: ogData.url,
                        topic_video_input: ogData['video:url'] ? ogData['video:url'] : ''
                    }

                    if (ogData.url && imageData) {
                        try {
                            const uploadedImage = await uploadImage(imageData);
                            options['topic_file_upload'] = uploadedImage.url ? uploadedImage.url : '';
                            options['topic_file_upload_id'] = uploadedImage.id ? uploadedImage.id : null;
                        } catch (error) {
                            console.error('Error while uploading image');
                            this.set('submitError', 'Something went wrong! Please try again later');
                            return false;
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
                this.set('submitError', 'Invalid submit url');
            }
        },

        handleOnChange(value) {
            if (value) {
                this.url = value.trim();
            }
        },

        async handleOnBlur(url) {
            if (url && await validateUrl(url)) {
                this.set('submitError', null);
            } else {
                this.set('submitError', 'Invalid submit url');
            }
        }
    }
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

async function parseHtml(htmlData) {
    const parser = new DOMParser();
    const doc = parser.parseFromString(htmlData, 'text/html');

    const ogMetaData = {};
    const metaArr = ['locale', 'type', 'title', 'description', 'url', 'site_name', 'image', 'image:type', 'image:width', 'image:height', 'video:url'];

    metaArr.forEach(item => {
        let ogContentData = doc.querySelector(`meta[property='og:${item}']`);
        if (!ogContentData) {
            ogContentData = doc.querySelector(`meta[name='twitter:${item}']`);
        }
        if (ogContentData) {
            ogMetaData[item] = ogContentData.content || '';
        } else {
            ogMetaData[item] = null;
        }
    });

    return ogMetaData;
}

async function createFile(url, imageName, imageType) {
  let response = await fetch(url);

  let data = await response.blob();
  let metadata = {
    type: data.type,
  };

  return new File([data], imageName, metadata);
}

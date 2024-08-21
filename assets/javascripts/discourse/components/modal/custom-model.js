import Component from "@ember/component";
import { inject as service } from '@ember/service';
import Composer from "discourse/models/composer";

export default Component.extend({
    url: null,
    modal: service(),
    composer: service(),
    actions: {
        async submit() {
            const proxyUrl = 'https://corsproxy.io/?';
            const targetUrl = this.get('url');

            let ogData;
            try {
                const response = await fetch(proxyUrl + targetUrl);
                const html = await response.text();
                ogData = await parseHtml(html);
            } catch (error) {
                console.error('Something went wrong while fetching data!', error);
            }

            if (ogData) {
                let imageData;
                if (ogData.url) {
                    const imageName = ogData.image.match(/.*\/(.*)$/)[1]; // .split('.')[0];
                    try {
                        imageData = await createFile(proxyUrl + ogData.image, imageName);
                    } catch (error) {
                        console.error('Error while downloading file', error);
                    }
                }

                this.modal.close();

                let options = {
                    title: ogData.title,
                    topicBody: ogData.description,
                    read_full_story: ogData.url
                }

                if (ogData.url && imageData) {
                    try {
                        const uploadedImage = await uploadImage(imageData);
                        options['topic_file_upload'] = uploadedImage.url;
                        options['topic_file_upload_id'] = uploadedImage.id;
                    } catch (error) {
                        console.error('Error while uploading image', error);
                    }
                }

                this.composer.open({
                    action: Composer.CREATE_TOPIC,
                    draftKey: Composer.DRAFT,
                    ...options
                });
            } else {
                this.modal.close();
            }
        },

        handleOnChange(value) {
            if (value) {
                this.url = value.trim();
            }
        }
    }
});

async function parseHtml(htmlData) {
    const parser = new DOMParser();
    const doc = parser.parseFromString(htmlData, 'text/html');

    const ogMetaData = {};
    const metaArr = ['locale', 'type', 'title', 'description', 'url', 'site_name', 'image', 'image:type', 'image:width', 'image:height'];

    metaArr.forEach(item => {
        const ogContentData = doc.querySelector(`meta[property='og:${item}']`) // .getAttribute("content");
        ogMetaData[item] = ogContentData.content;
    })

    return ogMetaData;
}

async function createFile(url, imageName) {
    let response = await fetch(url);

    let data = await response.blob();
    let metadata = {
        type: data.type,
    };

    return new File([data], imageName, metadata);
}

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
        if (data) {
            return data;
        } else {
            throw new Error('Image upload failed');
        }
    } catch (error) {
        throw error;
    }
}
export async function uploadImage(file) {
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
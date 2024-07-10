import { withPluginApi } from 'discourse/lib/plugin-api';

export default {
    name: 'alert',
    initialize() {
        withPluginApi('0.8', api => {
            api.onPageChange(() => {
                if (Discourse.SiteSettings.awesomeness_enabled) {
                    alert('Awesomeness is enabled!');
                }
            });
        });
    }
};
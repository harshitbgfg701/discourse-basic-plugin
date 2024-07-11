import { withPluginApi } from 'discourse/lib/plugin-api';

export default {
    name: 'alert',
    initialize() {
        withPluginApi('0.8', api => {
            api.onPageChange(() => {
                if (Discourse.SiteSettings.bgfg_topic_custom_field_enabled) {
                    alert('Custom Topic Plugin is enabled!');
                }
            });
        });
    }
};
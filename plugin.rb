# name: discourse-topic-custom-fields
# about: A discourse plugin that adds custom field to topic
# version: 1.0.0
# authors: BGFG
# url: #

enabled_site_setting :bgfg_topic_custom_field_enabled
register_asset 'stylesheets/common.scss'

# Add a custom field to a topic
after_initialize do
    FIELD_NAME ||= SiteSetting.topic_custom_field_name
    FIELD_TYPE ||= SiteSetting.topic_custom_field_type

    # Register the field
    register_topic_custom_field_type(FIELD_NAME, FIELD_TYPE.to_sym)

    # Getter method
    add_to_class(:topic, FIELD_NAME.to_sym) do
        if !custom_fields[FIELD_NAME].nil?
            custom_fields[FIELD_NAME]
        else
            nil
        end
    end

    # Setter method
    add_to_class(:topic, "#{FIELD_NAME}=") do |value|
        custom_fields[FIELD_NAME] = value
    end

    # Update on topic creation
    on(:topic_created) do |topic, opts, user|
        topic.send("#{FIELD_NAME}=".to_sym, opts[FIELD_NAME.to_sym])
        topic.save!
    end

    # Update on topic edit
    PostRevisor.track_topic_field(FIELD_NAME.to_sym) do |tc, value|
        tc.record_change(FIELD_NAME, tc.topic.send(FIELD_NAME), value)
        tc.topic.send("#{FIELD_NAME}=".to_sym, value.present? ? value : nil)
    end

    # Searialize to topic
    add_to_serializer(:topic_view, FIELD_NAME.to_sym) do
        object.topic.send(FIELD_NAME)
    end

    # Preload the Fields
    add_preloaded_topic_list_custom_field(FIELD_NAME)

    # Serialize to the topic list
    add_to_serializer(:topic_list_item, FIELD_NAME.to_sym) do
        object.send(FIELD_NAME)
    end

end
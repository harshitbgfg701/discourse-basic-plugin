# name: discourse-topic-custom-fields
# about: A discourse plugin that adds custom field to topic
# version: 1.0.0
# authors: BGFG
# url: #

enabled_site_setting :bgfg_topic_custom_field_enabled
register_asset 'stylesheets/common.scss'

# Add a custom field to a topic
after_initialize do
  field_name = SiteSetting.topic_custom_field_name.strip.gsub(/\s+/, '_').downcase
  field_type = SiteSetting.topic_custom_field_type

  # Register the field
  Topic.register_custom_field_type(field_name, field_type.to_sym)

  # Getter method
  add_to_class(:topic, field_name.to_sym) do
    custom_fields[field_name]
  end

  # Setter method
  add_to_class(:topic, "#{field_name}=") do |value|
    custom_fields[field_name] = value
  end

  # Serialize to topic
#   add_to_serializer(:topic_view, field_name.to_sym, respect_plugin_enabled: true) do
#     Rails.logger.info("#{field_name.to_sym}");
#     object.topic.field_name
#   end

  # Preload the Fields
  add_preloaded_topic_list_custom_field(field_name)

  # Update on topic creation
  DiscourseEvent.on(:topic_created) do |topic, opts, user|
    # topic.send("#{field_name}=".to_sym, opts[field_name.to_sym])
    # topic.save!
    # topic.custom_fields[field_name] = opts[field_name.to_sym]
    # topic.save!

    Rails.logger.info("topic: #{topic.inspect}");
    Rails.logger.info("opts: #{opts.inspect}");
    Rails.logger.info("does field name present: #{topic.custom_fields[field_name]}");
    Rails.logger.info("custom_description: #{opts[field_name.to_sym]}");

    if topic.custom_fields[field_name].present?
        topic.custom_fields[field_name] = opts[field_name.to_sym]
        topic.save_custom_fields(true)
        Rails.logger.info("Saved custom_description: #{opts[field_name.to_sym]}")
    else
        Rails.logger.warn("custom_description is nil or empty")
    end
  end

  # Update on topic edit
  PostRevisor.track_topic_field(field_name.to_sym) do |tc, value|
    # tc.record_change(field_name, tc.topic.custom_fields(field_name), value)
    # tc.topic.send("#{field_name}=".to_sym, value.present? ? value : nil)
    # tc.topic.custom_fields[field_name] = value.present? ? value : nil

    tc.record_change("#{field_name}=".to_sym, tc.topic.custom_fields[field_name], value)
    tc.topic.custom_fields[field_name] = value
  end


  # Serialize to the topic list
  add_to_serializer(:topic_list_item, field_name.to_sym) do
    object.send(field_name)
  end
end
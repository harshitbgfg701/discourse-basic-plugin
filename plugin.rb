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
  add_to_serializer(:topic_view, field_name.to_sym, respect_plugin_enabled: true) do
    Rails.logger.info("#{field_name.to_sym}");
    object.topic.send(field_name.to_sym)
  end

  # Preload the Fields
  add_preloaded_topic_list_custom_field(field_name)

  # Update on topic creation
  DiscourseEvent.on(:topic_created) do |topic, opts, user|
    if opts[field_name.to_sym].present?
        topic.custom_fields[field_name] = opts[field_name.to_sym]
        topic.save_custom_fields(true)
        Rails.logger.info("Saved #{field_name} with value: #{opts[field_name.to_sym]}")
    else
        Rails.logger.warn("#{field_name} is nil or empty: #{opts[field_name.to_sym]}")
    end
  end

  # Update on topic edit
  PostRevisor.track_topic_field(field_name.to_sym) do |tc, value|
    tc.record_change("#{field_name}=".to_sym, tc.topic.custom_fields[field_name], value)
    tc.topic.custom_fields[field_name] = value
  end

  # Serialize to the topic list
  add_to_serializer(:topic_list_item, field_name.to_sym) do
    object.send(field_name)
  end


  # Add file upload custom field
  file_upload_field_name = 'topic_file_upload'
  Topic.register_custom_field_type(file_upload_field_name, :string)
    # Getter method
  add_to_class(:topic, file_upload_field_name.to_sym) do
    custom_fields[file_upload_field_name]
  end

  # Setter method
  add_to_class(:topic, "#{file_upload_field_name}=") do |value|
    custom_fields[file_upload_field_name] = value
  end

  # Serialize to topic
  add_to_serializer(:topic_view, file_upload_field_name.to_sym, respect_plugin_enabled: true) do
    Rails.logger.info("#{file_upload_field_name.to_sym}");
    object.topic.send(file_upload_field_name.to_sym)
  end

  # Preload the Fields
  add_preloaded_topic_list_custom_field(file_upload_field_name)

  # Update on topic creation
  DiscourseEvent.on(:topic_created) do |topic, opts, user|
    if opts[file_upload_field_name.to_sym].present?
        topic.custom_fields[file_upload_field_name] = opts[file_upload_field_name.to_sym]
        topic.save_custom_fields(true)
        Rails.logger.info("Saved #{file_upload_field_name} with value: #{opts[file_upload_field_name.to_sym]}")
    else
        Rails.logger.warn("#{file_upload_field_name} is nil or empty: #{opts[file_upload_field_name.to_sym]}")
    end
  end

  # Update on topic edit
  PostRevisor.track_topic_field(file_upload_field_name.to_sym) do |tc, value|
    tc.record_change("#{file_upload_field_name}=".to_sym, tc.topic.custom_fields[file_upload_field_name], value)
    tc.topic.custom_fields[file_upload_field_name] = value
  end

  # Serialize to the topic list
  add_to_serializer(:topic_list_item, file_upload_field_name.to_sym) do
    object.send(file_upload_field_name)
  end

  # Customizing User Model
  custom_thumbnail_style_dropdown = 'custom_thumbnail_style_dropdown'
  User.register_custom_field_type(custom_thumbnail_style_dropdown, :string)

  # Serialize to user
  add_to_serializer(:current_user, custom_thumbnail_style_dropdown.to_sym) do
    object.custom_fields[custom_thumbnail_style_dropdown]
  end

  module ::CustomField
    class Engine < ::Rails::Engine
      engine_name "custom_field"
      isolate_namespace CustomField
    end
  end

  require_dependency 'application_controller'
  require_relative 'app/controllers/custom_field/custom_fields_controller'

  CustomField::Engine.routes.draw do
    post '/update_custom_field/:id' => 'custom_fields#update'
  end

  Discourse::Application.routes.append do
    mount ::CustomField::Engine, at: '/custom-field'
  end

end

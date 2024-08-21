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

  # Add topic video url input field
  topic_video_field = 'topic_video_input'
  # Register the field
  Topic.register_custom_field_type(topic_video_field, :string)

  # Getter method
  add_to_class(:topic, topic_video_field.to_sym) do
    custom_fields[topic_video_field]
  end

  # Setter method
  add_to_class(:topic, "#{topic_video_field}=") do |value|
    custom_fields[topic_video_field] = value
  end

  # Serialize to topic
  add_to_serializer(:topic_view, topic_video_field.to_sym, respect_plugin_enabled: true) do
    Rails.logger.info("#{topic_video_field.to_sym}");
    object.topic.send(topic_video_field.to_sym)
  end

  # Preload the Fields
  add_preloaded_topic_list_custom_field(topic_video_field)

  # Update on topic creation
  DiscourseEvent.on(:topic_created) do |topic, opts, user|
    if opts[topic_video_field.to_sym].present?
        topic.custom_fields[topic_video_field] = opts[topic_video_field.to_sym]
        topic.save_custom_fields(true)
        Rails.logger.info("Saved #{topic_video_field} with value: #{opts[topic_video_field.to_sym]}")
    else
        Rails.logger.warn("#{topic_video_field} is nil or empty: #{opts[topic_video_field.to_sym]}")
    end
  end

  # Update on topic edit
  PostRevisor.track_topic_field(topic_video_field.to_sym) do |tc, value|
    tc.record_change("#{topic_video_field}=".to_sym, tc.topic.custom_fields[topic_video_field], value)
    tc.topic.custom_fields[topic_video_field] = value
  end

  # Serialize to the topic list
  add_to_serializer(:topic_list_item, topic_video_field.to_sym) do
    object.send(topic_video_field)
  end

  # Add topic credit url input field
  topic_credit_field = 'topic_credit_input'
  # Register the field
  Topic.register_custom_field_type(topic_credit_field, :string)

  # Getter method
  add_to_class(:topic, topic_credit_field.to_sym) do
    custom_fields[topic_credit_field]
  end

  # Setter method
  add_to_class(:topic, "#{topic_credit_field}=") do |value|
    custom_fields[topic_credit_field] = value
  end

  # Serialize to topic
  add_to_serializer(:topic_view, topic_credit_field.to_sym, respect_plugin_enabled: true) do
    Rails.logger.info("#{topic_credit_field.to_sym}");
    object.topic.send(topic_credit_field.to_sym)
  end

  # Preload the Fields
  add_preloaded_topic_list_custom_field(topic_credit_field)

  # Update on topic creation
  DiscourseEvent.on(:topic_created) do |topic, opts, user|
    if opts[topic_credit_field.to_sym].present?
        topic.custom_fields[topic_credit_field] = opts[topic_credit_field.to_sym]
        topic.save_custom_fields(true)
        Rails.logger.info("Saved #{topic_credit_field} with value: #{opts[topic_credit_field.to_sym]}")
    else
        Rails.logger.warn("#{topic_credit_field} is nil or empty: #{opts[topic_credit_field.to_sym]}")
    end
  end

  # Update on topic edit
  PostRevisor.track_topic_field(topic_credit_field.to_sym) do |tc, value|
    tc.record_change("#{topic_credit_field}=".to_sym, tc.topic.custom_fields[topic_credit_field], value)
    tc.topic.custom_fields[topic_credit_field] = value
  end

  # Serialize to the topic list
  add_to_serializer(:topic_list_item, topic_credit_field.to_sym) do
    object.send(topic_credit_field)
  end


  # Add file upload custom field
  file_upload_field_name = 'topic_file_upload'
  file_upload_field_id = 'topic_file_upload_id'
  Topic.register_custom_field_type(file_upload_field_name, :string)
  Topic.register_custom_field_type(file_upload_field_id, :number)
    # Getter method
  add_to_class(:topic, file_upload_field_name.to_sym) do
    custom_fields[file_upload_field_name]
  end
  add_to_class(:topic, file_upload_field_id.to_sym) do
    custom_fields[file_upload_field_id]
  end

  # Setter method
  add_to_class(:topic, "#{file_upload_field_name}=") do |value|
    custom_fields[file_upload_field_name] = value
  end
  add_to_class(:topic, "#{file_upload_field_id}=") do |value|
    custom_fields[file_upload_field_id] = value
  end

  # Serialize to topic
  add_to_serializer(:topic_view, file_upload_field_name.to_sym, respect_plugin_enabled: true) do
    Rails.logger.info("Topic view file upload: #{file_upload_field_name.to_sym}");
    object.topic.send(file_upload_field_name.to_sym)
  end

  # Preload the Fields
  add_preloaded_topic_list_custom_field(file_upload_field_name)
  add_preloaded_topic_list_custom_field(file_upload_field_id)

  # Update on topic creation
  DiscourseEvent.on(:topic_created) do |topic, opts, user|
    if opts[file_upload_field_name.to_sym].present?
        topic.custom_fields[file_upload_field_name] = opts[file_upload_field_name.to_sym]
        topic.custom_fields[file_upload_field_id] = opts[file_upload_field_id.to_sym]
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
  PostRevisor.track_topic_field(file_upload_field_id.to_sym) do |tc, value|
    tc.record_change("#{file_upload_field_id}=".to_sym, tc.topic.custom_fields[file_upload_field_id], value)
    tc.topic.custom_fields[file_upload_field_id] = value
  end

  # Serialize to the topic list
  add_to_serializer(:topic_list_item, file_upload_field_name.to_sym) do
    object.send(file_upload_field_name)
  end

  if respond_to?(:register_upload_in_use)
    register_upload_in_use do |upload|
        TopicCustomField.where(
            name: 'topic_file_upload_id',
            value: upload.id
        ).exists?
    end
  end

  module ::CustomPostProcessor
    def update_post_image
      super # Call the original method
      
      if @post.is_first_post? # If this is the first post in the topic
      upload_id = @post.topic.custom_fields['topic_file_upload_id']

      Rails.logger.info("Upload Id is: #{upload_id}")
      
        if upload_id
            @post.update_column(:image_upload_id, upload_id) # Update the post
            @post.topic.update_column(:image_upload_id, upload_id) # Update the topic
        end
      end
    end
  end

  # Include the module in the CookedPostProcessor class
  ::CookedPostProcessor.prepend(CustomPostProcessor)

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

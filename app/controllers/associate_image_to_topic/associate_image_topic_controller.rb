module AssociateImageToTopic
  class AssociateImageTopicController < ::ApplicationController
    def update
      topic_id = params[:topic_id]
      upload_id = params[:upload_id]

      Rails.logger.info "Received topic_id: #{topic_id}, upload_id: #{upload_id}"

      if topic_id.present? && upload_id.present?
        # topic = Topic.find_by(id: topic_id)
        # Rails.logger.info "Before update: #{topic.inspect}"

        # if topic
          # Fetch the first post of the topic
          post = Post.find_by(topic_id: topic_id, post_number: 1) # Typically, the first post has post_number = 1

          if post
            if post.update(image_upload_id: upload_id)
              Rails.logger.info "Successfully updated post with id #{post.id} for topic #{topic_id}"
              render json: { success: true, message: "Post image updated successfully" }
            else
              Rails.logger.error "Failed to update post with id #{post.id}. Errors: #{post.errors.full_messages}"
              render json: { success: false, message: "Failed to update post image" }, status: :unprocessable_entity
            end
          else
            Rails.logger.error "Post for topic with id #{topic_id} not found"
            render json: { success: false, message: "Post not found" }, status: :not_found
          end

        #   if topic.update(image_upload_id: upload_id)
        #     Rails.logger.info "Successfully updated topic with id #{topic_id}"
        #   else
        #     Rails.logger.error "Failed to update topic with id #{topic_id}. Errors: #{topic.errors.full_messages}"
        #   end
        # else
        #   Rails.logger.error "Topic with id #{topic_id} not found"
        #   render json: { success: false, message: "Topic not found" }, status: :not_found
        # end
      else
        Rails.logger.error "Invalid parameters. topic_id: #{topic_id}, upload_id: #{upload_id}"
        render json: { success: false, message: "Invalid parameters" }, status: :bad_request
      end
    end
  end
end

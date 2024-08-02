# app/controllers/custom_field/custom_fields_controller.rb
module CustomField
  class CustomFieldsController < ::ApplicationController
    def update
      user = User.find(params[:id])
      if user && params[:custom_thumbnail_style_dropdown]
        user.custom_fields['custom_thumbnail_style_dropdown'] = params[:custom_thumbnail_style_dropdown]
        if user.save_custom_fields
          render json: { success: true }
        else
          render json: { success: false, error: 'Unable to save custom field' }, status: 400
        end
      else
        render json: { success: false, error: 'Invalid parameters' }, status: 400
      end
    end
  end
end

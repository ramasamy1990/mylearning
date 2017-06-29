package com.laquinta.services.config.translation;

import java.util.Date;
import java.util.Map;

import javax.jcr.Node;
import javax.jcr.Session;

import org.apache.commons.lang3.StringUtils;
import org.apache.felix.scr.annotations.Activate;
import org.apache.felix.scr.annotations.Component;
import org.apache.felix.scr.annotations.ConfigurationPolicy;
import org.apache.felix.scr.annotations.Modified;
import org.apache.felix.scr.annotations.Property;
import org.apache.felix.scr.annotations.PropertyOption;
import org.apache.felix.scr.annotations.PropertyUnbounded;
import org.apache.felix.scr.annotations.Service;
import org.apache.sling.commons.osgi.PropertiesUtil;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import com.adobe.granite.workflow.WorkflowException;
import com.adobe.granite.workflow.WorkflowSession;
import com.adobe.granite.workflow.exec.WorkItem;
import com.adobe.granite.workflow.exec.WorkflowProcess;
import com.adobe.granite.workflow.metadata.MetaDataMap;

/**
 *  Workflow process that sets the metadata properties needed for Page translation.
 */
@Service
@Component(metatype = true, immediate = true, policy = ConfigurationPolicy.REQUIRE, label = "LQ - Redesign - Page Translation Workflow", description = "Translation workflow metadata configuration")

public class PageTranslationConfigurationService implements WorkflowProcess {

    private final Logger LOG = LoggerFactory
	        .getLogger(PageTranslationConfigurationService.class);
	
    private static final String WORKFLOW_META_DATA_PATH_SUFFIX = "/data/metaData";
    private static final String DEFAULT_PROJECT_SHORT_CODE = "LAQ000084";
    private static final String DEFAULT_EMPTY = "";
    private static final String DEFAULT_SUBMISSION_PRIORITY = "NORMAL";
    private static final String DEFAULT_SUBMISSION_NAME = "LQ Page Translation";
    private static final String[] DEFAULT_TARGET_LANGUAGES = {"es"};
    
    @Property(label = "Target Languages", unbounded = PropertyUnbounded.ARRAY, value = {"es"}, description = "Target Languages for Translation.")
    static final String TGT_LANGUAGES = "com.laquinta.services.config.translation.tgtLanguages";

    @Property(label = "Project Short Code", value = DEFAULT_PROJECT_SHORT_CODE, description = "Project Short Code for Translation.")
    static final String PROJECT_SHORT_CODE = "com.laquinta.services.config.translation.projectShortCode";

    @Property(label = "Submission Priority", 
    		description = "Submission Priority for Translation.", 
    		options = {         
    		@PropertyOption(name = "Low", value = "Low"),         
    		@PropertyOption(name = "Normal", value = "Normal"), 
    		@PropertyOption(name = "High", value = "High") 
    		},
    		value = "Normal"
    		)
    static final String SUBMISSION_PRIORITY = "com.laquinta.services.config.translation.submissionPriority";

    @Property(label = "Submission Name", value = DEFAULT_SUBMISSION_NAME, description = "Submission Name for Translation.")
    static final String SUBMISSION_NAME = "com.laquinta.services.config.translation.submissionName";

    @Property(label = "Submission Due Date", description = "Submission Due Date for Translation. Sample Due Date Format: October 31, 2016 00:00:00")
    static final String SUBMISSION_DUE_DATE = "com.laquinta.services.config.translation.submissionDueDate";

    private String projectShortCode;
    private String[] targetLangauges;
    private String submissionPriority;
    private String submissionName;
    private String submissionDueDate;    
    
    public void execute(WorkItem workItem, WorkflowSession wfSession,
        MetaDataMap args) throws WorkflowException {
        try {
            // Get JCR session
            Session jcrSession = wfSession.adaptTo(Session.class);

            if (jcrSession != null) {
                // Get workflow id
                String workflowId = workItem.getWorkflow().getId();

                // Create workflow metadata node path (workflowId + // "/data/metaData")
                String workflowMetaDataNodePath = workflowId.concat(WORKFLOW_META_DATA_PATH_SUFFIX);

                // Get workflow metadata node
                Node workflowMetaDataNode = jcrSession.getNode(workflowMetaDataNodePath);

                // Update workflow metadata node with target languages
                workflowMetaDataNode.setProperty("tgtLanguages", PropertiesUtil.toStringArray(targetLangauges));

                // Update workflow metadata node with project code
                workflowMetaDataNode.setProperty("projectShortCode", projectShortCode);

                // Update workflow metadata node with the priority
                if(StringUtils.isNotBlank(submissionPriority)){
                   workflowMetaDataNode.setProperty("submissionPriority", submissionPriority);
                }
                // Update workflow metadata node with the Submission Name
                workflowMetaDataNode.setProperty("submissionName", submissionName);

                // Update workflow metadata node with the Submission Due Date. Submit this property only if there is a configuration available
                if(StringUtils.isNotBlank(submissionDueDate)){
	           workflowMetaDataNode.setProperty("submissionDueDate", new Date(submissionDueDate).getTime());
                }
                
	        // Save changes
                jcrSession.save();
            }

        } catch (Exception exception) {
        	LOG.error("Exception in saving meta data to workflow instance.", exception);
        }
    }
    
    @Activate
    @Modified
    public void activate(Map<String, String> config) {
    	projectShortCode = PropertiesUtil.toString(config.get(PROJECT_SHORT_CODE), DEFAULT_PROJECT_SHORT_CODE);
    	targetLangauges = PropertiesUtil.toStringArray(config.get(TGT_LANGUAGES), DEFAULT_TARGET_LANGUAGES);
    	submissionName = PropertiesUtil.toString(config.get(SUBMISSION_NAME), DEFAULT_SUBMISSION_NAME);
    	submissionPriority = PropertiesUtil.toString(config.get(SUBMISSION_PRIORITY), DEFAULT_SUBMISSION_PRIORITY);
    	submissionDueDate = PropertiesUtil.toString(config.get(SUBMISSION_DUE_DATE), DEFAULT_EMPTY);
    	LOG.debug(this.getClass() + "service activated/modified.");
    }
}
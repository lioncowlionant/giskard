package ai.giskard.web.dto.ml;

import com.dataiku.j2ts.annotations.UIModel;
import lombok.AllArgsConstructor;
import lombok.Getter;

import javax.validation.constraints.NotNull;

@Getter
@UIModel
@AllArgsConstructor
public class UpdateTestSuiteDTO {
    private Long id;
    @NotNull
    private String name;
    private Long trainDatasetId;
    private Long testDatasetId;
    private Long modelId;
}
